// node-api/src/services/packages/index.js

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

// ROTA GET /: Lista todos os pacotes
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const packages = await prisma.package.findMany({
        orderBy: { name: 'asc' },
        include: {
          platforms: true, // Inclui a lista de plataformas de cada pacote
          _count: {
            select: { users: true }, // Inclui a contagem de usuários em cada pacote
          },
        },
      });
      res.status(200).json(packages);
    } catch (error) {
      console.error("Erro ao listar pacotes:", error);
      res.status(500).json({ message: "Erro interno ao listar pacotes." });
    }
  }
);

// ROTA POST /: Cria um novo pacote
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, description, platformIds } = req.body; // Espera um nome e um array de IDs de plataforma
      if (!name) {
        return res.status(400).json({ message: "O nome do pacote é obrigatório." });
      }
      const newPackage = await prisma.package.create({
        data: {
          name,
          description,
          platforms: platformIds ? { connect: platformIds.map(id => ({ id })) } : undefined,
        },
      });
      res.status(201).json(newPackage);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Um pacote com este nome já existe." });
      }
      console.error("Erro ao criar pacote:", error);
      res.status(500).json({ message: "Erro interno ao criar o pacote." });
    }
  }
);

// ROTA PATCH /:id: Atualiza um pacote
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const packageId = parseInt(req.params.id, 10);
      const { name, description, platformIds } = req.body;

      const updatedPackage = await prisma.package.update({
        where: { id: packageId },
        data: {
          name,
          description,
          // 'set' substitui a lista de plataformas atual pela nova lista
          platforms: platformIds ? { set: platformIds.map(id => ({ id })) } : undefined,
        },
      });
      res.status(200).json(updatedPackage);
    } catch (error) {
      // ... (tratamento de erros)
    }
  }
);

// ROTA DELETE /:id: Deleta um pacote
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const packageId = parseInt(req.params.id, 10);

      // Verificação de segurança: impede deletar um pacote que está em uso
      const userCount = await prisma.user.count({ where: { packageId } });
      if (userCount > 0) {
        return res.status(409).json({ message: `Este pacote não pode ser deletado, pois está atribuído a ${userCount} usuário(s).` });
      }

      await prisma.package.delete({ where: { id: packageId } });
      res.status(200).json({ message: "Pacote deletado com sucesso." });
    } catch (error) {
      // ... (tratamento de erros)
    }
  }
);

export default router;