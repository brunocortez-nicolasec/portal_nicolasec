import express from "express";
import passport from "passport";
import multer from "multer";
import { PrismaClient } from '@prisma/client';
import Papa from "papaparse";

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- DICIONÁRIO DE SINÔNIMOS (HEURÍSTICA) ---
const aliasMap = {
  identityId: ["id", "matricula", "matrícula", "cpf", "id_usuario", "userid", "user_id", "email", "e-mail"],
  name: ["name", "nome", "nome completo", "nome_colaborador", "colaborador", "fullname"],
  email: ["email", "e-mail", "email_address", "email corporativo", "email_app"],
  status: ["status", "situacao", "situação", "status_rh", "status_app", "ativo/inativo"],
  userType: ["usertype", "tipo", "tipo_usuario", "tipo de usuario", "cargo"],
  perfil: ["perfil", "profile", "role", "funcao", "função"],
  ultimo_login: ["ultimo_login", "last_login", "ultimo acesso", "lastlogon"],
};

// Função auxiliar para normalizar texto (minúsculas, sem espaços, sem acentos)
const normalizeText = (text = "") => {
  if (!text) return "";
  return text.toLowerCase().replace(/[\s_-]+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

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
    data: { fileName: file.originalname, targetSystem, status: "PENDING", userId: user.id },
  });

  try {
    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    const rows = parsedCsv.data;
    const headers = parsedCsv.meta.fields || [];

    if (rows.length === 0) {
      throw new Error("O arquivo CSV está vazio ou em um formato inválido.");
    }
    
    // LÓGICA DE MAPEAMENTO DINÂMICO
    const columnMap = {};
    const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalizeText(h) }));

    for (const canonicalField in aliasMap) {
      for (const alias of aliasMap[canonicalField]) {
        const normalizedAlias = normalizeText(alias);
        const foundHeader = normalizedHeaders.find(h => h.normalized === normalizedAlias);
        if (foundHeader) {
          columnMap[canonicalField] = foundHeader.original;
          break; 
        }
      }
    }

    if (!columnMap.identityId) {
      throw new Error(`Não foi possível encontrar uma coluna de ID/identificador único no CSV. Colunas esperadas (ou sinônimos): ${aliasMap.identityId.join(", ")}`);
    }

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length },
    });

    const dataToCreate = rows.map(row => {
      const id = row[columnMap.identityId];
      if (!id) {
        throw new Error(`Uma linha no CSV está sem valor na coluna de ID ('${columnMap.identityId}'), que é obrigatória.`);
      }
      return {
        sourceSystem: targetSystem,
        identityId: String(id),
        name: row[columnMap.name],
        email: row[columnMap.email],
        status: row[columnMap.status],
        userType: row[columnMap.userType],
        extraData: {
          perfil: row[columnMap.perfil] || null,
          ultimo_login: row[columnMap.ultimo_login] ? new Date(row[columnMap.ultimo_login]).toISOString() : null,
        }
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.identity.deleteMany({
        where: { sourceSystem: { equals: targetSystem, mode: 'insensitive' } },
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

const deleteImportLog = async (req, res) => {
  const logId = parseInt(req.params.id, 10);
  if (isNaN(logId)) {
    return res.status(400).json({ message: "ID inválido." });
  }
  try {
    const log = await prisma.importLog.findUnique({ where: { id: logId } });
    if (!log) {
      return res.status(404).json({ message: "Registro de importação não encontrado." });
    }
    await prisma.importLog.delete({ where: { id: logId } });
    return res.status(204).send();
  } catch (error) {
    console.error(`Erro ao deletar o log de importação #${logId}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getImportHistory);
router.get("/check/:system", passport.authenticate("jwt", { session: false }), checkSystemData);
router.post("/", passport.authenticate("jwt", { session: false }), upload.single("csvFile"), handleCsvUpload);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteImportLog);

export default router;