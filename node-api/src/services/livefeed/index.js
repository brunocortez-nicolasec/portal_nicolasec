// node-api/src/services/livefeed/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Função auxiliar para checar todas as divergências entre duas identidades
const checkDivergences = (appUser, rhUser) => {
  if (!rhUser) return true; // Se não existe no RH, é uma divergência

  const cleanText = (text) => text?.trim().toLowerCase();
  const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

  if (appUser.status === 'Ativo' && rhUser.status === 'Inativo') return true;
  // ======================= INÍCIO DA ALTERAÇÃO =======================
  // Removida a verificação do campo 'login', que não existe mais no modelo padronizado
  // if (appUser.login && rhUser.login && cleanText(appUser.login) !== cleanText(rhUser.login)) return true;
  // ======================== FIM DA ALTERAÇÃO =======================
  if (appUser.cpf && rhUser.cpf && cleanCpf(appUser.cpf) !== cleanCpf(rhUser.cpf)) return true;
  if (appUser.name && rhUser.name && cleanText(appUser.name) !== cleanText(appUser.name)) return true;
  if (appUser.email && rhUser.email && cleanText(appUser.email) !== cleanText(rhUser.email)) return true;

  return false;
};

const getLiveFeedData = async (req, res) => {
  const { system } = req.query;

  try {
    const whereClause = { sourceSystem: { not: 'RH' } };
    if (system && system.toLowerCase() !== 'geral') {
      whereClause.sourceSystem = { equals: system, mode: 'insensitive' };
    }
    
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    const [rhIdentities, appIdentities] = await Promise.all([
      prisma.identity.findMany({
        where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
      }),
      // A consulta agora inclui o 'profile' relacionado
      prisma.identity.findMany({
        where: whereClause,
        include: {
          profile: {
            select: { name: true }
          }
        }
      }),
    ]);
    // ======================== FIM DA ALTERAÇÃO =======================

    // Cria um mapa do RH para buscas eficientes
    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));

    // Lógica App-cêntrica: constrói o feed a partir das identidades dos sistemas de aplicação
    const finalData = appIdentities.map(appUser => {
      const rhUser = rhMap.get(appUser.identityId);
      
      return {
        identityId: appUser.identityId,
        name: appUser.name,
        email: appUser.email,
        userType: appUser.userType,
        // ======================= INÍCIO DA ALTERAÇÃO =======================
        // O perfil agora é lido da relação, não mais do 'extraData'
        perfil: appUser.profile?.name || 'N/A',
        // ======================== FIM DA ALTERAÇÃO =======================
        rh_status: rhUser?.status || 'Não encontrado',
        app_status: appUser.status || 'N/A',
        sourceSystem: appUser.sourceSystem,
        divergence: checkDivergences(appUser, rhUser),
      };
    });
    
    return res.status(200).json(finalData);

  } catch (error) {
    console.error(`Erro ao buscar dados do Live Feed:`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getLiveFeedData
);

export default router;