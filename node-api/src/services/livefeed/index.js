// node-api/src/services/livefeed/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const getLiveFeedData = async (req, res) => {
  const { system } = req.query;

  try {
    const whereClause = { sourceSystem: { not: 'RH' } };
    if (system && system.toLowerCase() !== 'geral') {
      whereClause.sourceSystem = { equals: system, mode: 'insensitive' };
    }
    
    const [rhIdentities, appIdentities] = await Promise.all([
      prisma.identity.findMany({
        where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
      }),
      prisma.identity.findMany({
        where: whereClause,
        include: {
          profile: {
            select: { name: true }
          }
        }
      }),
    ]);

    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cleanText = (text) => text?.trim().toLowerCase();
    const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

    const finalData = appIdentities.map(appUser => {
      const rhUser = rhMap.get(appUser.identityId);

      const divergenceDetails = [];

      const isOrphan = !rhUser;
      if (isOrphan) {
        divergenceDetails.push({ code: 'ORPHAN', text: 'Conta Órfã: Usuário não foi encontrado no sistema de RH.' });
      }

      const isZombie = rhUser && appUser.status === 'Ativo' && rhUser.status === 'Inativo';
      if (isZombie) {
        divergenceDetails.push({ code: 'ZOMBIE', text: 'Acesso Ativo Indevido: Conta está ativa no sistema, mas inativa no RH.' });
      }

      const hasCpfDivergence = rhUser && appUser.cpf && rhUser.cpf && cleanCpf(appUser.cpf) !== cleanCpf(rhUser.cpf);
      if (hasCpfDivergence) {
        divergenceDetails.push({ code: 'CPF_MISMATCH', text: 'Divergência de CPF.' });
      }

      const hasNameDivergence = rhUser && appUser.name && rhUser.name && cleanText(appUser.name) !== cleanText(rhUser.name);
      if (hasNameDivergence) {
        divergenceDetails.push({ code: 'NAME_MISMATCH', text: 'Divergência de Nome.' });
      }
      
      const hasEmailDivergence = rhUser && appUser.email && rhUser.email && cleanText(appUser.email) !== cleanText(rhUser.email);
      if (hasEmailDivergence) {
        divergenceDetails.push({ code: 'EMAIL_MISMATCH', text: 'Divergência de E-mail.' });
      }

      const hasUserTypeDivergence = rhUser && appUser.userType && rhUser.userType && cleanText(appUser.userType) !== cleanText(rhUser.userType);
      if (hasUserTypeDivergence) {
        divergenceDetails.push({ code: 'USERTYPE_MISMATCH', text: 'Divergência de Tipo de Usuário.' });
      }

      const hasAnyDivergence = divergenceDetails.length > 0;

      let isCritical = false;
      const isAdmin = appUser.profile?.name === 'Admin';
      
      const loginDateStr = appUser.extraData?.last_login;
      const loginDate = loginDateStr ? new Date(loginDateStr) : null;
      const isDormant = loginDate && !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
      
      const isAdminDormente = isAdmin && isDormant;
      if (isAdminDormente) {
        divergenceDetails.push({ code: 'DORMANT_ADMIN', text: 'Conta de Administrador Dormente (sem login há mais de 90 dias).' });
      }
      
      const isAdminComDivergencia = isAdmin && hasAnyDivergence;

      if (isZombie || hasCpfDivergence || isAdminDormente || isAdminComDivergencia) {
        isCritical = true;
      }
      
      // ======================= INÍCIO DA ALTERAÇÃO =======================
      return {
        identityId: appUser.identityId,
        name: appUser.name,
        email: appUser.email,
        userType: appUser.userType,
        perfil: appUser.profile?.name || 'N/A',
        rh_status: rhUser?.status || 'Não encontrado',
        app_status: appUser.status || 'N/A',
        sourceSystem: appUser.sourceSystem,
        divergence: hasAnyDivergence,
        isCritical: isCritical,
        divergenceDetails: divergenceDetails,
        // Campos adicionados para o modal de detalhes
        id_user: appUser.identityId, // O frontend espera por 'id_user'
        cpf: appUser.cpf,
        last_login: appUser.extraData?.last_login,
      };
      // ======================== FIM DA ALTERAÇÃO =======================
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