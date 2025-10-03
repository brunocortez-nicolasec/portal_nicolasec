// node-api/src/services/livefeed/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Busca e consolida dados de identidades do RH e de um sistema de aplicação
 * para popular o Live Feed.
 * Ex: GET /live-feed (para Geral)
 * Ex: GET /live-feed?system=TruIM (para um sistema específico)
 */
const getLiveFeedData = async (req, res) => {
  // O sistema de aplicação (ex: TruIM) vem como parâmetro de query
  const { system } = req.query;

  try {
    // <<< ALTERAÇÃO 1: Lógica de busca para appIdentities foi corrigida
    let appIdentitiesWhereClause = {};

    if (system && system.toLowerCase() !== 'geral') {
      // Caso de um sistema específico
      appIdentitiesWhereClause = { sourceSystem: { equals: system, mode: 'insensitive' } };
    } else {
      // Caso "Geral" ou sem sistema (busca todos menos RH)
      appIdentitiesWhereClause = { sourceSystem: { not: 'RH' } };
    }
    
    // 1. Busca os dados do RH e do(s) sistema(s) de aplicação em paralelo
    const [rhIdentities, appIdentities] = await Promise.all([
      prisma.identity.findMany({
        where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
      }),
      // A query agora usa a cláusula 'where' dinâmica
      prisma.identity.findMany({
        where: appIdentitiesWhereClause,
      }),
    ]);
    // FIM DA ALTERAÇÃO 1

    // 2. Cria mapas para acesso rápido aos dados
    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
    const appMap = new Map(appIdentities.map(i => [i.identityId, i]));
    
    // Pega todos os IDs únicos de ambas as fontes
    const allUniqueIds = new Set([...rhMap.keys(), ...appMap.keys()]);

    // 3. Consolida os dados em uma única lista
    const consolidatedData = Array.from(allUniqueIds).map(id => {
      const rhData = rhMap.get(id);
      const appData = appMap.get(id);

      // Lógica de divergência
      const hasDivergence = (rhData?.status === 'Inativo' && appData?.status === 'Ativo');

      // <<< ALTERAÇÃO 2: Adicionado 'sourceSystem' ao objeto de retorno
      return {
        id: appData?.id || rhData?.id, // Usa o id do registro do banco
        identityId: id,
        name: appData?.name || rhData?.name || 'N/A',
        email: appData?.email || rhData?.email || 'N/A',
        sourceSystem: appData?.sourceSystem || null, // Adiciona o sistema de origem da aplicação
        rh_status: rhData?.status || 'Não encontrado',
        app_status: appData?.status || 'Não encontrado',
        userType: appData?.userType || rhData?.userType || 'N/A',
        perfil: appData?.extraData?.perfil || rhData?.extraData?.perfil || 'N/A',
        divergence: hasDivergence,
      };
      // FIM DA ALTERAÇÃO 2
    });

    // <<< ALTERAÇÃO 3: Filtra para não mostrar usuários que existem apenas no RH
    const finalData = consolidatedData.filter(user => user.sourceSystem !== null);

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