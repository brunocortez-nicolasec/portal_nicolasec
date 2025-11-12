// node-api/src/services/resources/index.js
// API para gerenciar o *Catálogo* de Recursos (model Resource)

import express from "express";
import passport from "passport";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /resources
 * @desc    Busca todos os Recursos (do catálogo)
 * @access  Private
 */
const getResources = async (req, res) => {
  try {
    // Busca os recursos, incluindo o 'System' ao qual pertencem
    const resources = await prisma.resource.findMany({
      // ======================= INÍCIO DA ALTERAÇÃO =======================
      orderBy: { name_resource: 'asc' }, // CORRIGIDO: O model usa 'name_resource'
      // ======================== FIM DA ALTERAÇÃO =========================
      include: {
        system: {
          select: { name_system: true }
        }
      }
    });
    res.status(200).json(resources);
  } catch (error) {
    console.error("Erro ao buscar catálogo de Recursos:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// Definindo as rotas
router.get("/", passport.authenticate("jwt", { session: false }), getResources);
// (POST, PATCH, DELETE serão adicionados aqui)

export default router;