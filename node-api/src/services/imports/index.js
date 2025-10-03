import express from "express";
import passport from "passport";
import multer from "multer";
import { PrismaClient } from '@prisma/client';
import Papa from "papaparse";

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Lógica de Serviço ---

const getImportHistory = async (req, res) => {
  try {
    const importLogs = await prisma.importLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    return res.status(200).json(importLogs);
  } catch (error) {
    console.error("Erro ao buscar histórico de importações:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const checkSystemData = async (req, res) => {
  const { system } = req.params;
  try {
    const count = await prisma.identity.count({
      where: { sourceSystem: { equals: system, mode: 'insensitive' } },
    });
    return res.status(200).json({ exists: count > 0 });
  } catch (error) {
    console.error(`Erro ao verificar dados para o sistema ${system}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const handleCsvUpload = async (req, res) => {
  const user = req.user;
  const file = req.file;
  const { targetSystem } = req.body;

  if (!user || !file || !targetSystem) {
    return res.status(400).json({ message: "Dados incompletos para o upload." });
  }

  const importLog = await prisma.importLog.create({
    data: {
      fileName: file.originalname,
      targetSystem: targetSystem,
      status: "PENDING",
      userId: user.id,
    },
  });

  try {
    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    const rows = parsedCsv.data;

    if (rows.length === 0) {
      throw new Error("O arquivo CSV está vazio ou em um formato inválido.");
    }

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length },
    });

    const dataToCreate = rows.map(row => {
      if (!row.id) {
        throw new Error(`Uma linha no CSV está sem a coluna 'id', que é obrigatória.`);
      }
      return {
        sourceSystem: targetSystem,
        identityId: String(row.id),
        name: row.name,
        email: row.email,
        status: row.status,
        userType: row.userType,
        extraData: {
          perfil: row.perfil || null,
          ultimo_login: row.ultimo_login ? new Date(row.ultimo_login).toISOString() : null,
        }
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.identity.deleteMany({
        where: { 
          sourceSystem: { equals: targetSystem, mode: 'insensitive' } 
        },
      });
      await tx.identity.createMany({
        data: dataToCreate,
      });
    });

    const finishedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: "SUCCESS",
        processedRows: rows.length,
        completedAt: new Date(),
      },
      include: { user: { select: { name: true } } },
    });

    return res.status(201).json(finishedLog);

  } catch (error) {
    console.error(`Falha ao processar importação #${importLog.id}:`, error);
    const failedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: "FAILED",
        errorDetails: error.message,
        completedAt: new Date(),
      },
      include: { user: { select: { name: true } } },
    });
    return res.status(500).json(failedLog);
  }
};

// --- FUNÇÃO DE EXCLUSÃO CORRIGIDA ---
const deleteImportLog = async (req, res) => {
  const logId = parseInt(req.params.id, 10);
  if (isNaN(logId)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  try {
    // A lógica agora é simples: encontrar o log pelo ID e deletá-lo.
    // A transação e a exclusão em massa foram removidas.
    const log = await prisma.importLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return res.status(404).json({ message: "Registro de importação não encontrado." });
    }

    await prisma.importLog.delete({
      where: { id: logId },
    });

    return res.status(204).send(); // Sucesso
  } catch (error) {
    console.error(`Erro ao deletar o log de importação #${logId}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// --- Definição das Rotas (sem alterações) ---
router.get("/", passport.authenticate("jwt", { session: false }), getImportHistory);
router.get("/check/:system", passport.authenticate("jwt", { session: false }), checkSystemData);
router.post("/", passport.authenticate("jwt", { session: false }), upload.single("csvFile"), handleCsvUpload);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteImportLog);

export default router;