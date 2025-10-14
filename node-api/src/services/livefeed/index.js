// node-api/src/services/livefeed/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const getLiveFeedData = async (req, res) => {
    const { system } = req.query;

    try {
        const isGeneral = !system || system.toLowerCase() === 'geral';
        const whereClause = { sourceSystem: { not: 'RH' } };
        if (!isGeneral) {
            whereClause.sourceSystem = { equals: system, mode: 'insensitive' };
        }
        
        const [rhIdentities, appIdentities] = await Promise.all([
            prisma.identity.findMany({
                where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
                include: { profile: { select: { name: true } } } // Incluir perfil para Admins
            }),
            prisma.identity.findMany({
                where: whereClause,
                include: { profile: { select: { name: true } } }
            }),
        ]);

        const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cleanText = (text) => text?.trim().toLowerCase();
        const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

        // Etapa 1: Processa as identidades que existem nos sistemas de destino (lógica original)
        const finalData = appIdentities.map(appUser => {
            const rhUser = rhMap.get(appUser.identityId);

            const divergenceDetails = [];

            const isOrphan = !rhUser;
            if (isOrphan) {
                divergenceDetails.push({ code: 'ORPHAN', text: 'Conta Órfã: Usuário não foi encontrado no sistema de RH.' });
            }

            if(rhUser) { // Só checa outras divergências se o usuário existe no RH
                const isZombie = appUser.status === 'Ativo' && rhUser.status === 'Inativo';
                if (isZombie) {
                    divergenceDetails.push({ code: 'ZOMBIE', text: 'Acesso Ativo Indevido: Conta está ativa no sistema, mas inativa no RH.' });
                }
                const hasCpfDivergence = appUser.cpf && rhUser.cpf && cleanCpf(appUser.cpf) !== cleanCpf(rhUser.cpf);
                if (hasCpfDivergence) {
                    divergenceDetails.push({ code: 'CPF_MISMATCH', text: 'Divergência de CPF.' });
                }
                const hasNameDivergence = appUser.name && rhUser.name && cleanText(appUser.name) !== cleanText(rhUser.name);
                if (hasNameDivergence) {
                    divergenceDetails.push({ code: 'NAME_MISMATCH', text: 'Divergência de Nome.' });
                }
                const hasEmailDivergence = appUser.email && rhUser.email && cleanText(appUser.email) !== cleanText(rhUser.email);
                if (hasEmailDivergence) {
                    divergenceDetails.push({ code: 'EMAIL_MISMATCH', text: 'Divergência de E-mail.' });
                }
                const hasUserTypeDivergence = appUser.userType && rhUser.userType && cleanText(appUser.userType) !== cleanText(rhUser.userType);
                if (hasUserTypeDivergence) {
                    divergenceDetails.push({ code: 'USERTYPE_MISMATCH', text: 'Divergência de Tipo de Usuário.' });
                }
            }

            let hasAnyDivergence = divergenceDetails.length > 0;
            let isCritical = false;
            const isAdmin = appUser.profile?.name === 'Admin';
            
            const loginDateStr = appUser.extraData?.last_login;
            const loginDate = loginDateStr ? new Date(loginDateStr) : null;
            const isDormant = loginDate && !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
            
            const isAdminDormente = isAdmin && isDormant;
            if (isAdminDormente) {
                divergenceDetails.push({ code: 'DORMANT_ADMIN', text: 'Conta de Administrador Dormente (sem login há mais de 90 dias).' });
                hasAnyDivergence = true; 
            }
            
            if (divergenceDetails.some(d => ['ZOMBIE', 'CPF_MISMATCH'].includes(d.code)) || isAdminDormente || (isAdmin && hasAnyDivergence)) {
                isCritical = true;
            }
            
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
                id_user: appUser.identityId,
                cpf: appUser.cpf,
                last_login: appUser.extraData?.last_login,
            };
        });
        
        // <<< INÍCIO DA NOVA LÓGICA >>>
        // Etapa 2: Encontrar usuários ativos no RH que estão faltando nos sistemas
        const missingAccessUsers = [];
        const activeRhIdentities = rhIdentities.filter(rhId => rhId.status === 'Ativo');

        const createMissingUserEntry = (rhUser, missingSystem) => {
            const divergenceDetails = [{ code: 'ACCESS_NOT_GRANTED', text: `Acesso Previsto Não Concedido: Usuário ativo no RH, mas sem conta em ${missingSystem}.` }];
            const isAdmin = rhUser.profile?.name === 'Admin';
            
            return {
                identityId: rhUser.identityId,
                name: rhUser.name,
                email: rhUser.email,
                userType: rhUser.userType,
                perfil: 'N/A',
                rh_status: rhUser.status,
                app_status: 'Não encontrado',
                sourceSystem: missingSystem, // Indica onde o acesso está faltando
                divergence: true,
                isCritical: isAdmin, // Acesso não concedido para um admin é crítico
                divergenceDetails: divergenceDetails,
                id_user: rhUser.identityId,
                cpf: rhUser.cpf,
                last_login: null,
            };
        };

        if (isGeneral) {
            const allAppSystems = [...new Set(appIdentities.map(i => i.sourceSystem))];
            allAppSystems.forEach(systemName => {
                const systemIdentityIds = new Set(appIdentities.filter(i => i.sourceSystem === systemName).map(i => i.identityId));
                activeRhIdentities.forEach(rhUser => {
                    if (!systemIdentityIds.has(rhUser.identityId)) {
                        missingAccessUsers.push(createMissingUserEntry(rhUser, systemName));
                    }
                });
            });
        } else {
            const appIdentityIds = new Set(appIdentities.map(i => i.identityId));
            activeRhIdentities.forEach(rhUser => {
                if (!appIdentityIds.has(rhUser.identityId)) {
                    missingAccessUsers.push(createMissingUserEntry(rhUser, system));
                }
            });
        }
        
        // Etapa 3: Combinar os resultados
        const combinedData = [...finalData, ...missingAccessUsers];
        // <<< FIM DA NOVA LÓGICA >>>
        
        return res.status(200).json(combinedData);

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