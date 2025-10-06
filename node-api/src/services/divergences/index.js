// node-api/src/services/divergences/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Busca os detalhes de um tipo específico de divergência.
 * Ex: GET /divergences/rh-inativo-app-ativo?system=TruIM (Específico)
 * Ex: GET /divergences/rh-inativo-app-ativo (Geral)
 */
const getDivergenceDetails = async (req, res) => {
  const { type } = req.params;
  const { system } = req.query; // O sistema de app vem como query param

  try {
    let divergenceData = [];

    switch (type) {
      case 'rh-inativo-app-ativo': {
        const appIdentitiesWhere = {
          status: 'Ativo',
        };

        if (system) {
          // Caso Específico: Um sistema foi solicitado
          appIdentitiesWhere.sourceSystem = { equals: system, mode: 'insensitive' };
        } else {
          // ======================= INÍCIO DA ALTERAÇÃO =======================
          // Caso "Geral": Busca todos os sistemas que NÃO são 'RH' (sintaxe corrigida)
          appIdentitiesWhere.sourceSystem = { not: 'RH' };
          // ======================== FIM DA ALTERAÇÃO =======================
        }

        const appIdentities = await prisma.identity.findMany({
          where: appIdentitiesWhere
        });

        const rhIdentities = await prisma.identity.findMany({
          where: {
            sourceSystem: { equals: 'RH', mode: 'insensitive' },
            status: 'Inativo',
          }
        });

        const inactiveRhIds = new Set(rhIdentities.map(i => i.identityId));

        divergenceData = appIdentities.filter(appIdentity => inactiveRhIds.has(appIdentity.identityId));
        
        break;
      }
      
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