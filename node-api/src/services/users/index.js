import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();

// --- CORRIGIDO ---
const isAdmin = (req, res, next) => {
  // O req.user vem do passport.js corrigido, que já inclui 'profile'
  // Corrigido de 'admin' (minúsculo) para 'Admin' (maiúsculo)
  if (req.user && req.user.profile?.name === 'Admin') { 
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// Rota GET (Corrigido include)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: { profile: true, package: true }, // 'role' -> 'profile'
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(users);
    } catch (error) {
      console.error("List Users Error:", error);
      res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  }
);

// Rota POST (Corrigido)
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, email, password, role, packageId } = req.body; 
      
      const profileObject = await prisma.profile.findUnique({ where: { name: role } });
      
      if (!profileObject) {
        return res.status(400).json({ message: `O perfil '${role}' não é válido.` });
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
          profileId: profileObject.id, // 'roleId' -> 'profileId'
          packageId: packageId || null,
        },
        include: { profile: true, package: true }, // 'role' -> 'profile'
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Create User Error:", error);
      res.status(500).json({ message: "Erro ao criar o usuário." });
    }
  }
);

// Rota PATCH (Corrigido)
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
        const profileObject = await prisma.profile.findUnique({ where: { name: roleNameToFind } });
        
        if (!profileObject) {
          return res.status(400).json({ message: `O perfil '${roleNameToFind}' não é válido.` });
        }
        dataToUpdate.profileId = profileObject.id; // 'roleId' -> 'profileId'
      }
      
      if (packageId !== undefined) {
        dataToUpdate.packageId = packageId === "" ? null : packageId;
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        include: { profile: true, package: true }, // 'role' -> 'profile'
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ message: "Erro ao atualizar o usuário." });
    }
  }
);

// Rota DELETE (Não precisou de alterações)
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