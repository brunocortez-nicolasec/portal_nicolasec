// node-api/src/services/divergences/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Busca os detalhes de um tipo específico de divergência.
 * Ex: GET /divergences/rh-inativo-app-ativo?system=TruIM
 */
const getDivergenceDetails = async (req, res) => {
  const { type } = req.params;
  const { system } = req.query; // O sistema de app vem como query param

  try {
    let divergenceData = [];

    switch (type) {
      case 'rh-inativo-app-ativo':
        if (!system) {
          return res.status(400).json({ message: "O parâmetro 'system' é obrigatório para este tipo de divergência." });
        }

        // 1. Busca identidades ATIVAS no sistema de aplicação (ex: TruIM)
        const appIdentities = await prisma.identity.findMany({
          where: {
            sourceSystem: { equals: system, mode: 'insensitive' },
            status: 'Ativo',
          }
        });

        // 2. Busca identidades INATIVAS no sistema de RH
        const rhIdentities = await prisma.identity.findMany({
          where: {
            sourceSystem: { equals: 'RH', mode: 'insensitive' },
            status: 'Inativo',
          }
        });

        // 3. Cria um conjunto com os IDs dos inativos do RH para uma busca rápida
        const inactiveRhIds = new Set(rhIdentities.map(i => i.identityId));

        // 4. Filtra as identidades do App, mantendo apenas aquelas que existem no conjunto de inativos do RH
        divergenceData = appIdentities.filter(appIdentity => inactiveRhIds.has(appIdentity.identityId));
        
        break;

      // (Futuramente, outros 'case' para outros tipos de divergência podem ser adicionados aqui)
      
      default:
        return res.status(400).json({ message: "Tipo de divergência desconhecido." });
    }

    return res.status(200).json(divergenceData);

  } catch (error) {
    console.error(`Erro ao buscar detalhes da divergência '${type}':`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição da Rota ---
router.get(
  "/:type",
  passport.authenticate("jwt", { session: false }),
  getDivergenceDetails
);

export default router;