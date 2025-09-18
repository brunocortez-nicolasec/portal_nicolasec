// node-api/src/services/roles/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role?.name === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// ROTA GET: Retorna todas as funções (sem alterações)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
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

// ROTA POST: Cria uma nova função (sem alterações)
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "O nome da função é obrigatório." });
      }

      const newRole = await prisma.role.create({
        data: { name },
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

// --- NOVA ROTA PATCH: Atualiza o nome de uma função ---
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.id, 10);
      const { name } = req.body;

      if (isNaN(roleId)) {
        return res.status(400).json({ message: "ID de função inválido." });
      }
      if (!name) {
        return res.status(400).json({ message: "O novo nome da função é obrigatório." });
      }

      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: { name },
      });

      res.status(200).json(updatedRole);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Uma função com este nome já existe." });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Função não encontrada." });
      }
      console.error("Erro ao atualizar função:", error);
      res.status(500).json({ message: "Erro interno ao atualizar a função." });
    }
  }
);

// --- NOVA ROTA DELETE: Deleta uma função ---
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.id, 10);

      if (isNaN(roleId)) {
        return res.status(400).json({ message: "ID de função inválido." });
      }

      // Verificação de segurança: impede deletar uma função que está em uso
      const userCount = await prisma.user.count({
        where: { roleId: roleId },
      });

      if (userCount > 0) {
        return res.status(409).json({ message: `Esta função não pode ser deletada, pois está atribuída a ${userCount} usuário(s).` });
      }

      await prisma.role.delete({
        where: { id: roleId },
      });

      res.status(200).json({ message: "Função deletada com sucesso." });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Função não encontrada." });
      }
      console.error("Erro ao deletar função:", error);
      res.status(500).json({ message: "Erro interno ao deletar a função." });
    }
  }
);

export default router;