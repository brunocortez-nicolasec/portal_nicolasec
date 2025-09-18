// node-api/src/services/roles/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// --- 1. CORREÇÃO PRINCIPAL AQUI ---
// Middleware com a lógica correta para verificar a permissão de Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role?.name === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// ROTA GET: Retorna todas as funções do banco de dados
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin, // <-- 2. Segurança reativada
  async (req, res) => {
    try {
      const roles = await prisma.role.findMany({
        orderBy: { createdAt: 'asc' }
      });
      res.status(200).json(roles);
    } catch (error) {
      console.error("Erro ao buscar funções:", error);
      res.status(500).json({ message: "Erro interno ao buscar funções." });
    }
  }
);

// ROTA POST: Cria uma nova função
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin, // <-- 3. Segurança reativada
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "O nome da função é obrigatório." });
      }

      const newRole = await prisma.role.create({
        data: {
          name,
        },
      });

      res.status(201).json(newRole);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Uma função com este nome já existe." });
      }
      console.error("Erro ao criar função:", error);
      res.status(500).json({ message: "Erro interno ao criar a função." });
    }
  }
);

export default router;