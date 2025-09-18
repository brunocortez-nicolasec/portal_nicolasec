// node-api/src/services/groups/index.js

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

// ROTA GET /: Lista todos os grupos com contagem de usuários
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const groups = await prisma.group.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });
      res.status(200).json(groups);
    } catch (error) {
      console.error("Erro ao listar grupos:", error);
      res.status(500).json({ message: "Erro interno ao listar grupos." });
    }
  }
);

// ROTA GET /:id: Busca um grupo específico com sua lista de membros
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "ID de grupo inválido." });
      }

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true,
              role: {
                select: {
                  name: true,
                },
              },
            }
          }
        }
      });

      if (!group) {
        return res.status(404).json({ message: "Grupo não encontrado." });
      }

      res.status(200).json(group);
    } catch (error) {
      console.error("Erro ao buscar detalhes do grupo:", error);
      res.status(500).json({ message: "Erro interno ao buscar detalhes do grupo." });
    }
  }
);

// ROTA POST /: Cria um novo grupo
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, userIds } = req.body;
      if (!name) {
        return res.status(400).json({ message: "O nome do grupo é obrigatório." });
      }
      const newGroup = await prisma.group.create({
        data: {
          name,
          users: userIds ? { connect: userIds.map(id => ({ id })) } : undefined,
        },
      });
      res.status(201).json(newGroup);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Um grupo com este nome já existe." });
      }
      console.error("Erro ao criar grupo:", error);
      res.status(500).json({ message: "Erro interno ao criar o grupo." });
    }
  }
);

// --- ROTA PATCH /:id: (COM DEBUG) ---
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);
      const { name, userIds } = req.body;

      // --- DEBUG 1: VERIFICAR O QUE A API ESTÁ RECEBENDO ---
      console.log(`Recebido para atualizar Grupo ID ${groupId}:`, req.body);

      if (isNaN(groupId)) {
        return res.status(400).json({ message: "ID de grupo inválido." });
      }
      
      const dataToUpdate = {
        name,
        users: userIds ? { set: userIds.map(id => ({ id })) } : undefined,
      };

      // --- DEBUG 2: VERIFICAR O QUE ESTÁ SENDO ENVIADO PARA O BANCO ---
      console.log(`Dados preparados para o Prisma.update:`, dataToUpdate);

      const updatedGroup = await prisma.group.update({
        where: { id: groupId },
        data: dataToUpdate,
      });

      res.status(200).json(updatedGroup);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Um grupo com este nome já existe." });
      }
       if (error.code === 'P2025') {
        return res.status(404).json({ message: "Grupo não encontrado." });
      }
      console.error("Erro ao atualizar grupo:", error);
      res.status(500).json({ message: "Erro interno ao atualizar o grupo." });
    }
  }
);

// ROTA DELETE /:id: Deleta um grupo
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "ID de grupo inválido." });
      }
      await prisma.group.delete({
        where: { id: groupId },
      });
      res.status(200).json({ message: "Grupo deletado com sucesso." });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Grupo não encontrado." });
      }
      console.error("Erro ao deletar grupo:", error);
      res.status(500).json({ message: "Erro interno ao deletar o grupo." });
    }
  }
);

export default router;