// node-api/src/services/users/index.js - VERSÃO COM CORREÇÃO DO TIPO DE ID

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware de verificação de Admin (sem alterações)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// Rota GET / para buscar todos os usuários (sem alterações)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, profile_image: true, createdAt: true },
      });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  }
);

// --- Rota PATCH /:id para ATUALIZAR um usuário (COM A CORREÇÃO) ---
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      // --- MUDANÇA: Converte o ID da URL (String) para um número (Int) ---
      const userId = parseInt(req.params.id, 10);
      const { name, email, role } = req.body;
      
      // Validação para garantir que o ID é um número válido
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId }, // <-- Usa o ID convertido
        data: { name, email, role },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ message: "Erro ao atualizar o usuário." });
    }
  }
);

// --- Rota DELETE /:id para DELETAR um usuário (COM A CORREÇÃO) ---
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      // --- MUDANÇA: Converte o ID da URL (String) para um número (Int) ---
      const userId = parseInt(req.params.id, 10);

      // Validação para garantir que o ID é um número válido
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
      }
      
      // Proteção para não deletar o próprio usuário
      if (req.user.id === userId) { // <-- Comparação agora funciona (número com número)
        return res.status(400).json({ message: "Você não pode deletar sua própria conta." });
      }

      await prisma.user.delete({
        where: { id: userId }, // <-- Usa o ID convertido
      });

      res.status(200).json({ message: "Usuário deletado com sucesso." });
    } catch (error) {
      console.error("Delete User Error:", error);
      res.status(500).json({ message: "Erro ao deletar o usuário." });
    }
  }
);

export default router;