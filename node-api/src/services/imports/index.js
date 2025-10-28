import express from "express";
import passport from "passport";
import multer from "multer";
import { PrismaClient } from '@prisma/client';
import Papa from "papaparse";

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Lógica de Serviço ---

const getImportHistory = async (req, res) => { /* ... (código existente sem alterações) ... */
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

const checkSystemData = async (req, res) => { /* ... (código existente sem alterações) ... */
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

const handleCsvUpload = async (req, res) => { /* ... (código existente sem alterações) ... */
  const user = req.user;
  const file = req.file;
  const { targetSystem } = req.body;

  if (!user || !file || !targetSystem) {
    return res.status(400).json({ message: "Dados incompletos para o upload." });
  }

  // Corrigindo para usar userId como Int (se seu model User usa Int)
  const userIdInt = parseInt(user.id, 10);
  if (isNaN(userIdInt)){
      return res.status(400).json({ message: "ID de usuário inválido." });
  }

  const importLog = await prisma.importLog.create({
    data: { fileName: file.originalname, targetSystem, status: "PENDING", userId: userIdInt }, // Usa Int
  });

  try {
    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    const fileHeaders = parsedCsv.meta.fields || [];
    const requiredHeaders = ['id_user', 'nome_completo', 'email', 'status', 'cpf', 'userType', 'last_login', 'perfil'];

    if (JSON.stringify(fileHeaders) !== JSON.stringify(requiredHeaders)) {
      throw new Error(`O cabeçalho do CSV não corresponde ao template. Esperado: [${requiredHeaders.join(', ')}], Recebido: [${fileHeaders.join(', ')}]`);
    }

    const rows = parsedCsv.data;
    if (rows.length === 0) {
      throw new Error("O arquivo CSV está vazio ou não contém dados.");
    }

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length },
    });

    await prisma.$transaction(async (tx) => {
      // Esta linha continua aqui, pois a CADA NOVA importação, limpamos os dados ANTES de inserir os novos.
      await tx.identity.deleteMany({
        where: { sourceSystem: { equals: targetSystem, mode: 'insensitive' } },
      });

      for (const [index, row] of rows.entries()) {
        const id = row.id_user;
        if (!id) {
          throw new Error(`Linha ${index + 2} do CSV não possui um 'id_user', que é obrigatório.`);
        }

        const lastLoginDate = row.last_login ? new Date(row.last_login) : null;
        const lastLoginIso = (lastLoginDate && !isNaN(lastLoginDate)) ? lastLoginDate.toISOString() : null;

        const profileName = row.perfil?.trim();

        const identityData = {
          sourceSystem: targetSystem,
          identityId: String(id),
          name: row.nome_completo,
          email: row.email,
          status: row.status,
          cpf: row.cpf,
          userType: row.userType,
          extraData: {
            last_login: lastLoginIso,
          }
        };

        if (profileName) {
          identityData.profile = {
            connectOrCreate: {
              where: { name: profileName },
              create: { name: profileName },
            },
          };
        }

        await tx.identity.create({ data: identityData });
      }
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


// --- FUNÇÃO deleteImportLog MODIFICADA ---
const deleteImportLog = async (req, res) => {
  const logId = parseInt(req.params.id, 10);
  if (isNaN(logId)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  try {
    // 1. Tenta deletar o log diretamente pelo ID
    const deleteResult = await prisma.importLog.deleteMany({ // Usar deleteMany para evitar erro se não encontrar
        where: { id: logId }
    });

    // 2. Verifica se algum log foi deletado
    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Registro de importação não encontrado." });
    }

    // 3. (REMOVIDO) Não há mais verificação de log mais recente ou exclusão de identidades aqui.

    // 4. Retorna sucesso
    return res.status(204).send();

  } catch (error) {
    console.error(`Erro ao deletar o log de importação #${logId}:`, error);
    // Adiciona verificação para erros de constraint (se algo depender do log)
    if (error.code === 'P2003') {
         return res.status(409).json({ message: "Não é possível excluir este log pois ele está sendo referenciado em outro lugar." });
     }
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};
// --- FIM DA MODIFICAÇÃO ---

// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getImportHistory);
router.get("/check/:system", passport.authenticate("jwt", { session: false }), checkSystemData);
router.post("/", passport.authenticate("jwt", { session: false }), upload.single("csvFile"), handleCsvUpload);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteImportLog); // Rota continua a mesma

export default router;