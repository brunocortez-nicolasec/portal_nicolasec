// node-api/src/services/identities/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Busca e filtra as identidades com base nos parâmetros da query.
 * Ex: GET /identities?sourceSystem=TruIM&userType=Funcionário
 */
const getIdentities = async (req, res) => {
  // Pega os filtros da query string da URL
  const { sourceSystem, userType, status } = req.query;

  // Monta a cláusula 'where' dinamicamente com base nos filtros recebidos
  const whereClause = {};

  // 1. Lógica para o filtro de sistema
  if (sourceSystem) {
    // Se um sistema específico é passado, filtra por ele.
    whereClause.sourceSystem = { equals: sourceSystem, mode: 'insensitive' };
  } else {
    // Se NENHUM sistema é passado (visão "Geral"), exclui o RH por padrão.
    whereClause.sourceSystem = { not: 'RH' };
  }

  // ======================= INÍCIO DA ALTERAÇÃO =======================

  // 2. Lógica para o filtro de tipo de usuário
  if (userType) {
    if (userType === 'Não categorizado') {
      // Sintaxe correta: Usa o operador OR para buscar por nulo OU string vazia.
      whereClause.OR = [
        { userType: null },
        { userType: '' },
      ];
    } else {
      // Para os outros casos, usa o valor diretamente.
      whereClause.userType = userType;
    }
  }

  // ======================== FIM DA ALTERAÇÃO =======================

  // 3. Lógica para o filtro de status (inalterada)
  if (status) {
    whereClause.status = status;
  }

  try {
    const identities = await prisma.identity.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return res.status(200).json(identities);
  } catch (error) {
    console.error("Erro ao buscar identidades:", error);
    return res.status(500).json({ message: "Erro interno do servidor ao buscar identidades." });
  }
};

// --- Definição da Rota de Busca de Identidades ---
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getIdentities
);

export default router;