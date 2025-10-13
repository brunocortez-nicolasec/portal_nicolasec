// node-api/src/services/divergences/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// ======================= INÍCIO DAS NOVAS FUNÇÕES =======================

/**
 * @route   POST /divergences/exceptions
 * @desc    Cria uma nova exceção para uma divergência específica de uma identidade
 * @access  Private
 */
const createDivergenceException = async (req, res) => {
  const { identityId, divergenceCode, justification } = req.body;
  const userId = req.user.id;

  if (!identityId || !divergenceCode || !justification) {
    return res.status(400).json({ message: "ID da identidade, código da divergência e justificativa são obrigatórios." });
  }

  try {
    const newException = await prisma.divergenceException.create({
      data: {
        identityId,
        divergenceCode,
        justification,
        userId,
      },
    });
    res.status(201).json(newException);
  } catch (error) {
    // Trata o erro caso a exceção já exista (violando a constraint @@unique)
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "Já existe uma exceção para esta divergência nesta identidade." });
    }
    console.error("Erro ao criar exceção de divergência:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   GET /divergences/by-code/:code
 * @desc    Busca todas as identidades que possuem um tipo de divergência específico,
 * excluindo aquelas que já têm uma exceção registrada.
 * @access  Private
 */
const getDivergencesByCode = async (req, res) => {
  const { code } = req.params;
  const { system } = req.query;

  try {
    let divergenceData = [];
    
    // Constrói a base da cláusula 'where' para as identidades de app
    const appIdentitiesWhere = {
      sourceSystem: { not: 'RH' },
      // Filtro para excluir identidades que já possuem uma exceção para este código
      NOT: {
        divergenceExceptions: {
          some: {
            divergenceCode: code,
          },
        },
      },
    };

    if (system && system.toLowerCase() !== 'geral') {
      appIdentitiesWhere.sourceSystem = { equals: system, mode: 'insensitive' };
    }

    // Busca todas as identidades do RH para comparação
    const rhIdentities = await prisma.identity.findMany({
      where: { sourceSystem: 'RH' },
    });
    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));

    switch (code) {
      // Caso para "Acessos Ativos Indevidos"
      case 'ZOMBIE_ACCOUNT': {
        const appIdentities = await prisma.identity.findMany({ where: appIdentitiesWhere });
        
        divergenceData = appIdentities.filter(appUser => {
          const rhUser = rhMap.get(appUser.identityId);
          return rhUser && appUser.status === 'Ativo' && rhUser.status === 'Inativo';
        });
        break;
      }
      
      // Caso para "Contas Órfãs"
      case 'ORPHAN_ACCOUNT': {
        const appIdentities = await prisma.identity.findMany({ where: appIdentitiesWhere });

        divergenceData = appIdentities.filter(appUser => !rhMap.has(appUser.identityId));
        break;
      }

      // Adicione outros 'case' aqui para outros códigos de divergência (ex: 'CPF_MISMATCH')
      
      default:
        return res.status(400).json({ message: `Código de divergência '${code}' desconhecido.` });
    }

    return res.status(200).json(divergenceData);

  } catch (error) {
    console.error(`Erro ao buscar detalhes da divergência '${code}':`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// ======================== FIM DAS NOVAS FUNÇÕES =======================


// --- Definição das Rotas ---

// Rota para criar exceções
router.post(
  "/exceptions",
  passport.authenticate("jwt", { session: false }),
  createDivergenceException
);

// Rota para buscar divergências por código (para o drill-down)
router.get(
  "/by-code/:code",
  passport.authenticate("jwt", { session: false }),
  getDivergencesByCode
);


// Mantendo a rota antiga por compatibilidade, mas ela pode ser removida no futuro
const getDivergenceDetails = async (req, res) => { /* ... sua função antiga ... */ };
router.get(
  "/:type",
  passport.authenticate("jwt", { session: false }),
  getDivergenceDetails
);


export default router;