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
        
        // Busca identidades do RH e dos sistemas de App em paralelo
        const [rhIdentities, appIdentities] = await Promise.all([
            prisma.identity.findMany({
                where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
                include: { profile: { select: { name: true } } } // Inclui perfil para checar Admins no RH
            }),
            prisma.identity.findMany({
                where: whereClause,
                include: { profile: { select: { name: true } } } // Inclui perfil para checar Admins nos Apps
            }),
        ]);

        // Cria um mapa para acesso rápido aos dados do RH pelo identityId
        const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cleanText = (text) => text?.trim().toLowerCase();
        const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

        // --- Etapa 1: Processa as identidades que existem nos sistemas de destino ---
        const finalData = appIdentities.map(appUser => {
            const rhUser = rhMap.get(appUser.identityId);
            const divergenceDetails = []; // Array para armazenar detalhes das divergências encontradas

            const isOrphan = !rhUser;
            if (isOrphan) {
                // Para conta órfã, inclui apenas os dados da App
                divergenceDetails.push({ 
                    code: 'ORPHAN', 
                    text: 'Conta Órfã: Usuário não foi encontrado no sistema de RH.',
                    rhData: null,
                    appData: appUser 
                });
            }

            // Só checa outras divergências se o usuário existe no RH
            if(rhUser) { 
                const isZombie = appUser.status === 'Ativo' && rhUser.status === 'Inativo';
                if (isZombie) {
                    divergenceDetails.push({ 
                        code: 'ZOMBIE', 
                        text: 'Acesso Ativo Indevido: Conta está ativa no sistema, mas inativa no RH.',
                        rhData: rhUser, // Inclui dados do RH
                        appData: appUser // Inclui dados da App
                    });
                }
                const hasCpfDivergence = appUser.cpf && rhUser.cpf && cleanCpf(appUser.cpf) !== cleanCpf(rhUser.cpf);
                if (hasCpfDivergence) {
                    divergenceDetails.push({ 
                        code: 'CPF_MISMATCH', 
                        text: 'Divergência de CPF.',
                        rhData: rhUser,
                        appData: appUser
                    });
                }
                const hasNameDivergence = appUser.name && rhUser.name && cleanText(appUser.name) !== cleanText(rhUser.name);
                if (hasNameDivergence) {
                    divergenceDetails.push({ 
                        code: 'NAME_MISMATCH', 
                        text: 'Divergência de Nome.',
                        rhData: rhUser,
                        appData: appUser
                    });
                }
                const hasEmailDivergence = appUser.email && rhUser.email && cleanText(appUser.email) !== cleanText(rhUser.email);
                if (hasEmailDivergence) {
                    divergenceDetails.push({ 
                        code: 'EMAIL_MISMATCH', 
                        text: 'Divergência de E-mail.',
                        rhData: rhUser,
                        appData: appUser
                    });
                }
                const hasUserTypeDivergence = appUser.userType && rhUser.userType && cleanText(appUser.userType) !== cleanText(rhUser.userType);
                if (hasUserTypeDivergence) {
                    divergenceDetails.push({ 
                        code: 'USERTYPE_MISMATCH', 
                        text: 'Divergência de Tipo de Usuário.',
                        rhData: rhUser,
                        appData: appUser
                    });
                }
            }

            let hasAnyDivergence = divergenceDetails.length > 0;
            let isCritical = false;
            const isAdmin = appUser.profile?.name === 'Admin';
            
            // Verifica Admin Dormente (apenas se for admin, ativo e com data de login válida)
            const loginDateStr = typeof appUser.extraData === 'object' && appUser.extraData !== null ? appUser.extraData.last_login : null;
            const loginDate = loginDateStr ? new Date(loginDateStr) : null;
            const isDormant = loginDate && !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
            const isAdminDormente = isAdmin && appUser.status === 'Ativo' && isDormant; // Verifica se está ativo também
            
            if (isAdminDormente) {
                divergenceDetails.push({ 
                    code: 'DORMANT_ADMIN', 
                    text: 'Conta de Administrador Dormente (sem login há mais de 90 dias).',
                    rhData: rhUser, // Inclui dados do RH se existirem
                    appData: appUser // Inclui dados da App (contém last_login)
                });
                hasAnyDivergence = true; 
            }
            
            // Define a criticidade da identidade
            if (divergenceDetails.some(d => ['ZOMBIE', 'CPF_MISMATCH', 'DORMANT_ADMIN', 'ORPHAN'].includes(d.code)) || // Regras de criticidade
                (isAdmin && hasAnyDivergence && !isAdminDormente)) { // Admin com *qualquer* outra divergência (exceto dormente já contada)
                isCritical = true;
            }
            
            // Monta o objeto final para esta identidade da App
            return {
                id: appUser.id, // ID da tabela Identity (importante!)
                identityId: appUser.identityId,
                name: appUser.name,
                email: appUser.email,
                userType: appUser.userType,
                perfil: appUser.profile?.name || 'N/A', // Nome do perfil
                rh_status: rhUser?.status || 'Não encontrado',
                app_status: appUser.status || 'N/A',
                sourceSystem: appUser.sourceSystem,
                divergence: hasAnyDivergence,
                isCritical: isCritical,
                divergenceDetails: divergenceDetails, // Agora contém rhData e appData
                // Campos adicionais mantidos para compatibilidade com o modal
                id_user: appUser.identityId, 
                cpf: appUser.cpf,
                last_login: loginDateStr, // String original do último login
            };
        });
        
        // --- Etapa 2: Encontrar usuários ativos no RH que estão faltando nos sistemas (ACCESS_NOT_GRANTED) ---
        const missingAccessUsers = [];
        const activeRhIdentities = rhIdentities.filter(rhId => rhId.status === 'Ativo');

        // Função auxiliar para criar a entrada de usuário faltante
        const createMissingUserEntry = (rhUser, missingSystem) => {
            const divergenceDetails = [{ 
                code: 'ACCESS_NOT_GRANTED', 
                text: `Acesso Previsto Não Concedido: Usuário ativo no RH, mas sem conta em ${missingSystem}.`,
                rhData: rhUser,      // Inclui dados do RH
                appData: null,       // Não há dados da App
                targetSystem: missingSystem // Sistema onde o acesso está faltando
            }];
            const isAdmin = rhUser.profile?.name === 'Admin'; // Verifica se o usuário do RH era Admin
            
            // Monta o objeto final para esta divergência de acesso faltante
            return {
                id: `${rhUser.id}-${missingSystem}`, // Cria ID único composto
                identityId: rhUser.identityId,
                name: rhUser.name,
                email: rhUser.email,
                userType: rhUser.userType,
                perfil: 'N/A', // Perfil da App não aplicável
                rh_status: rhUser.status,
                app_status: 'Não encontrado',
                sourceSystem: missingSystem, // Indica onde o acesso está faltando
                divergence: true,
                isCritical: isAdmin, // Acesso não concedido para um admin é crítico
                divergenceDetails: divergenceDetails, // Contém rhData e targetSystem
                // Campos adicionais para compatibilidade com o modal
                id_user: rhUser.identityId,
                cpf: rhUser.cpf,
                last_login: null, // Não aplicável
            };
        };

        // Lógica para encontrar acessos faltantes (depende se é visão geral ou específica)
        if (isGeneral) { // Se for a visão "Geral", checa todos os sistemas
            const allAppSystems = [...new Set(appIdentities.map(i => i.sourceSystem))];
            allAppSystems.forEach(systemName => {
                const systemIdentityIds = new Set(appIdentities.filter(i => i.sourceSystem === systemName).map(i => i.identityId));
                activeRhIdentities.forEach(rhUser => {
                    if (!systemIdentityIds.has(rhUser.identityId)) {
                        missingAccessUsers.push(createMissingUserEntry(rhUser, systemName));
                    }
                });
            });
        } else { // Se for um sistema específico, checa apenas nele
            const appIdentityIds = new Set(appIdentities.map(i => i.identityId));
            activeRhIdentities.forEach(rhUser => {
                if (!appIdentityIds.has(rhUser.identityId)) {
                    missingAccessUsers.push(createMissingUserEntry(rhUser, system)); // Usa o nome do sistema do query param
                }
            });
        }
        
        // --- Etapa 3: Combinar os resultados ---
        const combinedData = [...finalData, ...missingAccessUsers];
        
        return res.status(200).json(combinedData);

    } catch (error) {
        console.error(`Erro ao buscar dados do Live Feed:`, error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
};

// Define a rota GET para o Live Feed
router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    getLiveFeedData
);

export default router;