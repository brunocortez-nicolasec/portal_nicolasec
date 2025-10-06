import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Busca e consolida dados de identidades do RH e de um ou todos os sistemas de aplicação
 * para popular o Live Feed.
 * Ex: GET /live-feed (para Geral)
 * Ex: GET /live-feed?system=TruIM (para um sistema específico)
 */
const getLiveFeedData = async (req, res) => {
  const { system } = req.query;

  try {
    let appIdentitiesWhereClause = {};

    // --- AQUI ESTÁ A CORREÇÃO ---
    if (system && system.toLowerCase() !== 'geral') {
      appIdentitiesWhereClause = { sourceSystem: { equals: system, mode: 'insensitive' } };
    } else {
      // Usamos 'notIn' com 'mode: insensitive' que é a forma suportada pelo Prisma
      appIdentitiesWhereClause = {
        sourceSystem: {
          notIn: ['RH'],
          mode: 'insensitive'
        }
      };
    }
    // --- FIM DA CORREÇÃO ---
    
    const [rhIdentities, appIdentities] = await Promise.all([
      prisma.identity.findMany({
        where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
      }),
      prisma.identity.findMany({
        where: appIdentitiesWhereClause,
      }),
    ]);

    const consolidatedMap = new Map();

    rhIdentities.forEach(rhUser => {
      consolidatedMap.set(rhUser.identityId, {
        identityId: rhUser.identityId,
        name: rhUser.name,
        email: rhUser.email,
        userType: rhUser.userType,
        perfil: rhUser.extraData?.perfil,
        rh_status: rhUser.status || 'N/A',
        app_status: 'Não encontrado',
        sourceSystem: 'RH',
        divergence: false,
      });
    });

    appIdentities.forEach(appUser => {
      const existingUser = consolidatedMap.get(appUser.identityId) || {};
      const hasDivergence = (existingUser.rh_status === 'Inativo' && appUser.status === 'Ativo');

      consolidatedMap.set(appUser.identityId, {
        ...existingUser,
        identityId: appUser.identityId,
        name: appUser.name || existingUser.name,
        email: appUser.email || existingUser.email,
        userType: appUser.userType || existingUser.userType,
        perfil: appUser.extraData?.perfil || existingUser.perfil,
        app_status: appUser.status || 'N/A',
        sourceSystem: appUser.sourceSystem,
        divergence: hasDivergence || existingUser.divergence,
      });
    });
    
    const finalData = Array.from(consolidatedMap.values());

    return res.status(200).json(finalData);

  } catch (error) {
    console.error(`Erro ao buscar dados do Live Feed:`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição da Rota ---
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getLiveFeedData
);

export default router;