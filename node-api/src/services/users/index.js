// node-api/src/services/users/index.js - VERSÃO COM ROTA DE CRIAÇÃO

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // <-- 1. IMPORTAÇÃO ADICIONADA

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

// --- 2. NOVA ROTA POST / para CRIAR um usuário ---
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      // Para simplificar, esperamos os dados diretamente no corpo da requisição
      const { name, email, password, role } = req.body;

      // Validação básica
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios: nome, email, senha e função." });
      }

      // Verifica se o usuário já existe
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Este email já está em uso." });
      }

      // Criptografa a senha antes de salvar
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true }, // Retorna o usuário sem a senha
      });

      res.status(201).json(newUser); // 201 Created
    } catch (error) {
      console.error("Create User Error:", error);
      res.status(500).json({ message: "Erro ao criar o usuário." });
    }
  }
);


// Rota PATCH /:id para ATUALIZAR um usuário (sem alterações)
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { name, email, role } = req.body.data.attributes;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
      }

      const dataToUpdate = { name, email, role };

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ message: "Erro ao atualizar o usuário." });
    }
  }
);

// Rota DELETE /:id para DELETAR um usuário (sem alterações)
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
      }
      
      if (req.user.id === userId) {
        return res.status(400).json({ message: "Você não pode deletar sua própria conta." });
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      res.status(200).json({ message: "Usuário deletado com sucesso." });
    } catch (error) {
      console.error("Delete User Error:", error);
      res.status(500).json({ message: "Erro ao deletar o usuário." });
    }
  }
);

export default router;