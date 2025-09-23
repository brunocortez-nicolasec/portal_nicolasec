// node-api/src/services/users/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role?.name === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// Rota GET (sem alterações)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: { role: true, package: true },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(users);
    } catch (error) {
      console.error("List Users Error:", error);
      res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  }
);

// Rota POST (sem alterações)
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, email, password, role, packageId } = req.body;
      const roleObject = await prisma.role.findUnique({ where: { name: role } });
      if (!roleObject) {
        return res.status(400).json({ message: `A função '${role}' não é válida.` });
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Este email já está em uso." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: roleObject.id,
          packageId: packageId || null,
        },
        include: { role: true, package: true },
      });
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Create User Error:", error);
      res.status(500).json({ message: "Erro ao criar o usuário." });
    }
  }
);

// Rota PATCH (COM A CORREÇÃO)
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { name, email, role, packageId } = req.body; 
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
      }
      
      const dataToUpdate = { name, email };
      
      if (role) {
        const roleNameToFind = typeof role === 'string' ? role : role.name;
        const roleObject = await prisma.role.findUnique({ where: { name: roleNameToFind } });
        
        if (!roleObject) {
          return res.status(400).json({ message: `A função '${roleNameToFind}' não é válida.` });
        }
        dataToUpdate.roleId = roleObject.id;
      }
      
      // --- MUDANÇA PRINCIPAL AQUI ---
      if (packageId !== undefined) {
          // Se packageId for um texto vazio (""), converte para null.
          // Senão, usa o valor recebido (que deve ser um número).
          dataToUpdate.packageId = packageId === "" ? null : packageId;
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        include: { role: true, package: true },
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ message: "Erro ao atualizar o usuário." });
    }
  }
);

// Rota DELETE (sem alterações)
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