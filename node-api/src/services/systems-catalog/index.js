// node-api/src/services/systems-catalog/index.js
// API para gerenciar o *Catálogo* de Sistemas (model System)

import express from "express";
import passport from "passport";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   POST /systems-catalog
 * @desc    Cria um novo Sistema (no catálogo)
 * @access  Private
 * @note    Chamado pelo "Passo 1" do wizard do DataSourceModal.
 */
const createSystem = async (req, res) => {
  const { name_system, description_system } = req.body;

  if (!name_system) {
    return res.status(400).json({ message: "O 'name_system' (Nome do Sistema) é obrigatório." });
  }

  try {
    // Verifica se já existe um sistema com esse nome (case-insensitive)
    const existingSystem = await prisma.system.findFirst({
      where: { name_system: { equals: name_system, mode: 'insensitive' } },
    });

    if (existingSystem) {
      return res.status(409).json({ message: `Um sistema com o nome "${name_system}" já existe.` });
    }

    // Cria o novo sistema no catálogo
    const newSystem = await prisma.system.create({
      data: {
        name_system: name_system,
        description_system: description_system,
        // createdAt e updatedAt são automáticos
      }
    });

    // Retorna o sistema criado (o frontend precisa do 'id')
    res.status(201).json(newSystem);

  } catch (error) {
    console.error("Erro ao criar sistema no catálogo:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   GET /systems-catalog
 * @desc    Busca todos os Sistemas (do catálogo)
 * @access  Private
 * @note    Usado pelo Dropdown no "Passo 2" do wizard.
 */
const getSystems = async (req, res) => {
  try {
    const systems = await prisma.system.findMany({
      orderBy: { name_system: 'asc' },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Erro ao buscar catálogo de sistemas:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// (Futuramente: Adicionar PATCH e DELETE aqui para a página 'Contas e Recursos')

// Definindo as rotas
router.post("/", passport.authenticate("jwt", { session: false }), createSystem);
router.get("/", passport.authenticate("jwt", { session: false }), getSystems);

export default router;