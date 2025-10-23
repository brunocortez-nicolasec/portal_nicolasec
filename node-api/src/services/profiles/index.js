// node-api/src/services/profiles/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /profiles
 * @desc    Busca todos os perfis (para dropdowns, etc.)
 * @access  Private
 */
const getProfiles = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { name: "asc" }, // Ordena alfabeticamente
      select: {
        id: true,
        name: true, // Retorna apenas ID e Nome, o suficiente para o dropdown
      },
    });
    res.status(200).json(profiles);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição da Rota ---
router.get("/", passport.authenticate("jwt", { session: false }), getProfiles);

export default router;