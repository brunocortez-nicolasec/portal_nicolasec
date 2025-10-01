// node-api/src/services/imports/index.js

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

const handleCsvUpload = async (req, res) => {
  const user = req.user;
  const file = req.file;
  const { targetSystem } = req.body;

  if (!user || !file || !targetSystem) {
    return res.status(400).json({ message: "Dados incompletos para o upload." });
  }

  try {
    const newLog = await prisma.importLog.create({
      data: {
        fileName: file.originalname,
        targetSystem: targetSystem,
        status: "PENDING",
        userId: user.id,
      },
    });

    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    
    const updatedLog = await prisma.importLog.update({
        where: { id: newLog.id },
        data: {
            status: "SUCCESS",
            totalRows: parsedCsv.data.length,
            processedRows: parsedCsv.data.length,
            completedAt: new Date(),
        }
    });

    return res.status(201).json(updatedLog);
  } catch (error) {
    console.error("Erro ao processar upload de CSV:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição das Rotas ---

router.get(
  "/", // A rota base será definida no index.js principal como "/imports"
  passport.authenticate("jwt", { session: false }),
  getImportHistory
);

router.post(
  "/", // A rota base será definida no index.js principal como "/imports"
  passport.authenticate("jwt", { session: false }),
  upload.single("csvFile"),
  handleCsvUpload
);

export default router;