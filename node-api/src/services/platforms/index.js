// node-api/src/services/platforms/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware de Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role?.name === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// ROTA GET: Lista todas as plataformas
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const platforms = await prisma.platform.findMany({
        orderBy: { name: 'asc' }
      });
      res.status(200).json(platforms);
    } catch (error) {
      console.error("Erro ao listar plataformas:", error);
      res.status(500).json({ message: "Erro interno ao listar plataformas." });
    }
  }
);

// ROTA POST: Cria uma nova plataforma
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, key, route, icon } = req.body;
      if (!name || !key || !route) {
        return res.status(400).json({ message: "Os campos 'name', 'key', e 'route' são obrigatórios." });
      }
      const newPlatform = await prisma.platform.create({
        data: { name, key, route, icon },
      });
      res.status(201).json(newPlatform);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Uma plataforma com esse 'name', 'key', ou 'route' já existe." });
      }
      console.error("Erro ao criar plataforma:", error);
      res.status(500).json({ message: "Erro interno ao criar a plataforma." });
    }
  }
);

// ROTA PATCH: Atualiza uma plataforma
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const platformId = parseInt(req.params.id, 10);
      const { name, key, route, icon } = req.body;

      const updatedPlatform = await prisma.platform.update({
        where: { id: platformId },
        data: { name, key, route, icon },
      });
      res.status(200).json(updatedPlatform);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Uma plataforma com esse 'name', 'key', ou 'route' já existe." });
      }
      console.error("Erro ao atualizar plataforma:", error);
      res.status(500).json({ message: "Erro interno ao atualizar a plataforma." });
    }
  }
);

// ROTA DELETE: Deleta uma plataforma
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const platformId = parseInt(req.params.id, 10);
      // O Prisma irá falhar se a plataforma estiver vinculada a um pacote, o que é uma boa proteção.
      await prisma.platform.delete({
        where: { id: platformId },
      });
      res.status(200).json({ message: "Plataforma deletada com sucesso." });
    } catch (error) {
      if (error.code === 'P2003') { // Foreign key constraint failed
         return res.status(409).json({ message: "Esta plataforma não pode ser deletada pois está associada a um ou mais pacotes." });
      }
      console.error("Erro ao deletar plataforma:", error);
      res.status(500).json({ message: "Erro interno ao deletar a plataforma." });
    }
  }
);

export default router;