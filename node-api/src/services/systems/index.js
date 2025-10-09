// node-api/src/services/systems/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /systems
 * @desc    Busca todos os sistemas criados pelo usuário logado
 * @access  Private
 */
const getSystems = async (req, res) => {
  try {
    const systems = await prisma.system.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Erro ao buscar sistemas:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   POST /systems
 * @desc    Cria um novo sistema para o usuário logado
 * @access  Private
 */
const createSystem = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "O nome do sistema é obrigatório." });
  }

  try {
    const existingSystem = await prisma.system.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, userId: req.user.id },
    });

    if (existingSystem) {
      return res.status(409).json({ message: `O sistema "${name}" já existe.` });
    }

    const newSystem = await prisma.system.create({
      data: {
        name,
        description,
        userId: req.user.id,
      },
    });
    res.status(201).json(newSystem);
  } catch (error) {
    console.error("Erro ao criar sistema:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// ======================= INÍCIO DA ADIÇÃO =======================
/**
 * @route   PATCH /systems/:id
 * @desc    Atualiza um sistema específico do usuário logado
 * @access  Private
 */
const updateSystem = async (req, res) => {
  const systemId = parseInt(req.params.id, 10);
  const { name, description } = req.body;

  if (isNaN(systemId)) {
    return res.status(400).json({ message: "ID de sistema inválido." });
  }
  if (!name) {
    return res.status(400).json({ message: "O nome do sistema é obrigatório." });
  }

  try {
    // 1. Verifica se o sistema pertence ao usuário
    const system = await prisma.system.findFirst({
      where: { id: systemId, userId: req.user.id },
    });

    if (!system) {
      return res.status(404).json({ message: "Sistema não encontrado ou não pertence a este usuário." });
    }

    // 2. Verifica se o novo nome já está em uso por outro sistema do mesmo usuário
    const existingSystemWithNewName = await prisma.system.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        userId: req.user.id,
        id: { not: systemId }, // Exclui o próprio sistema da busca
      },
    });

    if (existingSystemWithNewName) {
      return res.status(409).json({ message: `O nome "${name}" já está em uso por outro sistema.` });
    }

    // 3. Atualiza o sistema
    const updatedSystem = await prisma.system.update({
      where: { id: systemId },
      data: {
        name,
        description,
      },
    });

    res.status(200).json(updatedSystem);
  } catch (error) {
    console.error("Erro ao atualizar sistema:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};
// ======================== FIM DA ADIÇÃO =======================


/**
 * @route   DELETE /systems/:id
 * @desc    Deleta um sistema específico do usuário logado
 * @access  Private
 */
const deleteSystem = async (req, res) => {
  const systemId = parseInt(req.params.id, 10);

  if (isNaN(systemId)) {
    return res.status(400).json({ message: "ID de sistema inválido." });
  }
  
  try {
    const system = await prisma.system.findFirst({
      where: { id: systemId, userId: req.user.id },
    });

    if (!system) {
      return res.status(404).json({ message: "Sistema não encontrado ou não pertence a este usuário." });
    }

    await prisma.system.delete({
      where: { id: systemId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar sistema:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// Definindo as rotas
router.get("/", passport.authenticate("jwt", { session: false }), getSystems);
router.post("/", passport.authenticate("jwt", { session: false }), createSystem);
// ======================= INÍCIO DA ADIÇÃO =======================
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateSystem);
// ======================== FIM DA ADIÇÃO =======================
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteSystem);

export default router;