import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// --- CORRIGIDO ---
const isAdmin = (req, res, next) => {
  // O 'req.user' agora vem do passport.js corrigido, que inclui 'profile'
  // Corrigido de 'admin' (minúsculo) para 'Admin' (maiúsculo)
  if (req.user && req.user.profile?.name === 'Admin') { 
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// ROTA GET: Retorna todos os perfis
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      // --- CORRIGIDO ---
      const profiles = await prisma.profile.findMany({
        orderBy: { createdAt: 'asc' }
      });
      res.status(200).json(profiles);
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
      res.status(500).json({ message: "Erro interno ao buscar perfis." });
    }
  }
);

// ROTA POST: Cria um novo perfil
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "O nome do perfil é obrigatório." });
      }

      // --- CORRIGIDO ---
      const newProfile = await prisma.profile.create({
        data: { name },
      });

      res.status(201).json(newProfile);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Um perfil com este nome já existe." });
      }
      console.error("Erro ao criar perfil:", error);
      res.status(500).json({ message: "Erro interno ao criar o perfil." });
    }
  }
);

// ROTA PATCH: Atualiza o nome de um perfil
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const profileId = parseInt(req.params.id, 10); // --- CORRIGIDO (nome da var) ---
      const { name } = req.body;

      if (isNaN(profileId)) {
        return res.status(400).json({ message: "ID de perfil inválido." });
      }
      if (!name) {
        return res.status(400).json({ message: "O novo nome do perfil é obrigatório." });
      }

      // --- CORRIGIDO ---
      const updatedProfile = await prisma.profile.update({
        where: { id: profileId },
        data: { name },
      });

      res.status(200).json(updatedProfile);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Um perfil com este nome já existe." });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Perfil não encontrado." });
      }
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro interno ao atualizar o perfil." });
    }
  }
);

// ROTA DELETE: Deleta um perfil
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const profileId = parseInt(req.params.id, 10); // --- CORRIGIDO (nome da var) ---

      if (isNaN(profileId)) {
        return res.status(400).json({ message: "ID de perfil inválido." });
      }

      // --- CORRIGIDO ---
      // Verificação de segurança: impede deletar um perfil que está em uso
      const userCount = await prisma.user.count({
        where: { profileId: profileId }, // Busca por 'profileId'
      });

      if (userCount > 0) {
        return res.status(409).json({ message: `Este perfil não pode ser deletado, pois está atribuído a ${userCount} usuário(s).` });
      }

      await prisma.profile.delete({
        where: { id: profileId },
      });
      // --- FIM DA CORREÇÃO ---

      res.status(200).json({ message: "Perfil deletado com sucesso." });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Perfil não encontrado." });
      }
      console.error("Erro ao deletar perfil:", error);
      res.status(500).json({ message: "Erro interno ao deletar o perfil." });
    }
  }
);

export default router;