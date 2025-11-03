// node-api/src/services/livefeed/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Funções auxiliares (movidas para o topo para melhor organização)
const cleanText = (text) => text?.trim().toLowerCase();
const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

const getLiveFeedData = async (req, res) => {
    const { system } = req.query; // Pega 'system' da query string
    const isGeneral = !system || system.toLowerCase() === 'geral';
    // let targetSystemName = system; // Removido

    // Garante userId Int
    const userIdInt = parseInt(req.user.id, 10);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
    }

    try {
        // --- 1. Buscar Identidades (RH) e criar Mapas ---
        const rhIdentities = await prisma.identity.findMany({
            where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
        });
        
        const rhMapByCpf = new Map(rhIdentities.filter(i => i.cpf).map(i => [cleanCpf(i.cpf), i]));
        const rhMapByEmail = new Map(rhIdentities.filter(i => i.email).map(i => [cleanText(i.email), i]));

        // --- 2. Buscar Contas (Accounts) dos Sistemas ---
        const whereAccounts = {};
        let systemRecord = null;

        if (!isGeneral) {
            if (system.toUpperCase() === 'RH') {
                // Se for RH, não busca contas (whereAccounts fica vazio)
            } else {
                systemRecord = await prisma.system.findUnique({
                    where: { name: system },
                    select: { id: true }
                });
                if (!systemRecord) {
                    console.warn(`LiveFeed: Sistema ${system} não encontrado.`);
                    return res.status(404).json({ message: `Sistema "${system}" não encontrado.`});
                }
                whereAccounts.systemId = systemRecord.id;
            }
        }
        
        let systemAccounts = [];
        
        // Verifica se devemos buscar contas (ou seja, se NÃO for o RH)
        if (!system || system.toUpperCase() !== 'RH') { 
            systemAccounts = await prisma.account.findMany({
                where: whereAccounts, // Vazio se 'Geral', com systemId se 'Específico'
                include: {
                    profiles: {
                        include: {
                            profile: { select: { id: true, name: true } }
                        }
                    },
                    system: { select: { id: true, name: true } }
                },
            });
        }
        
        // Se a métrica for específica para o RH, formatamos as identidades
        if (system && system.toUpperCase() === 'RH') {
             systemAccounts = rhIdentities.map(id => ({
                 id: id.id,
                 accountIdInSystem: id.identityId,
                 name: id.name,
                 email: id.email,
                 status: id.status,
                 userType: id.userType,
                 cpf: id.cpf,
                 extraData: id.extraData,
                 identityId: id.id,
                 systemId: null,
                 system: { name: 'RH' },
                 profiles: [], // Identidade RH não tem perfis de app
             }));
        }
        
        // --- 3. Buscar Exceções do Usuário ---
        const identityExceptions = await prisma.identityDivergenceException.findMany({
            where: { userId: userIdInt },
            select: { identityId: true, divergenceCode: true, targetSystem: true }
        });
        const identityExceptionsSet = new Set(
            identityExceptions.map(ex => `${ex.identityId}_${ex.divergenceCode}_${ex.targetSystem}`)
        );

        const accountExceptions = await prisma.accountDivergenceException.findMany({
            where: { userId: userIdInt },
            select: { accountId: true, divergenceCode: true }
        });
        const accountExceptionsSet = new Set(
            accountExceptions.map(ex => `${ex.accountId}_${ex.divergenceCode}`)
        );

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // --- 4. Processar Contas (Órfãs, Zumbis, Mismatch, Dormentes) ---
        const finalData = systemAccounts.map(account => {
            // Se for Identity (formatada como conta), retorna
            if (account.system.name.toUpperCase() === 'RH') {
                 // --- INÍCIO DA CORREÇÃO (Criticidade de Identidade) ---
                 // Define se a identidade RH é admin
                 const isAdmin = (account.userType || '').toLowerCase().includes('admin');
                 // --- FIM DA CORREÇÃO ---
                 return {
                     id: account.id,
                     identityId: account.identityId,
                     name: account.name,
                     email: account.email,
                     userType: account.userType,
                     perfil: 'N/A (Fonte Autoritativa)', // Perfil da *identidade* (Tipo)
                     rh_status: account.status || 'N/A',
                     app_status: 'N/A',
                     sourceSystem: account.system.name,
                     divergence: false, 
                     isCritical: isAdmin, // <<< CORREÇÃO: Um admin no RH é "crítico" por natureza
                     divergenceDetails: [],
                     id_user: account.accountIdInSystem,
                     cpf: account.cpf,
                     last_login: account.extraData?.last_login || null,
                     rhData: account, 
                 };
            }

            // Para contas de APP, tenta encontrar a identidade RH correspondente
            const rhUser = (account.cpf && rhMapByCpf.get(cleanCpf(account.cpf))) ||
                           (account.email && rhMapByEmail.get(cleanText(account.email)));
            
            const divergenceDetails = [];
            
            // --- INÍCIO DA CORREÇÃO (Cálculo de Criticidade) ---
            // 1. Calcula o perfil e se é admin ANTES de checar divergências
            const perfilString = account.profiles.map(p => p.profile.name).join(', ') || 'N/A';
            const isAdmin = perfilString.toLowerCase().includes('admin');
            // --- FIM DA CORREÇÃO ---

            const isOrphan = !rhUser; 

            if (isOrphan) {
                const code = 'ORPHAN_ACCOUNT';
                const text = 'Conta Órfã: Não foi possível vincular a uma identidade do RH (sem CPF/Email correspondente).';
                
                if (!accountExceptionsSet.has(`${account.id}_${code}`)) {
                    divergenceDetails.push({ 
                        code: code, 
                        text: text,
                        rhData: null,
                        appData: account
                    });
                }
            }

            if(rhUser) { 
                const isZombie = account.status === 'Ativo' && rhUser.status === 'Inativo';
                if (isZombie && !accountExceptionsSet.has(`${account.id}_ZOMBIE_ACCOUNT`)) {
                    divergenceDetails.push({ code: 'ZOMBIE_ACCOUNT', text: 'Acesso Ativo Indevido: Conta ativa, mas identidade inativa no RH.', rhData: rhUser, appData: account });
                }
                const hasCpfDivergence = account.cpf && rhUser.cpf && cleanCpf(account.cpf) !== cleanCpf(rhUser.cpf);
                if (hasCpfDivergence && !accountExceptionsSet.has(`${account.id}_CPF_MISMATCH`)) {
                    divergenceDetails.push({ code: 'CPF_MISMATCH', text: 'Divergência de CPF.', rhData: rhUser, appData: account });
                }
                const hasNameDivergence = account.name && rhUser.name && cleanText(account.name) !== cleanText(rhUser.name);
                if (hasNameDivergence && !accountExceptionsSet.has(`${account.id}_NAME_MISMATCH`)) {
                    divergenceDetails.push({ code: 'NAME_MISMATCH', text: 'Divergência de Nome.', rhData: rhUser, appData: account });
                }
                const hasEmailDivergence = account.email && rhUser.email && cleanText(account.email) !== cleanText(rhUser.email);
                if (hasEmailDivergence && !accountExceptionsSet.has(`${account.id}_EMAIL_MISMATCH`)) {
                    divergenceDetails.push({ code: 'EMAIL_MISMATCH', text: 'Divergência de E-mail.', rhData: rhUser, appData: account });
                }
                const hasUserTypeDivergence = account.userType && rhUser.userType && cleanText(account.userType) !== cleanText(rhUser.userType);
                if (hasUserTypeDivergence && !accountExceptionsSet.has(`${account.id}_USERTYPE_MISMATCH`)) {
                    divergenceDetails.push({ code: 'USERTYPE_MISMATCH', text: 'Divergência de Tipo de Usuário.', rhData: rhUser, appData: account });
                }
            }

            let hasAnyDivergence = divergenceDetails.length > 0;
            
            // Lógica de Dormência
            const loginDateStr = typeof account.extraData === 'object' && account.extraData !== null ? account.extraData.last_login : null;
            const loginDate = loginDateStr ? new Date(loginDateStr) : null;
            const isDormant = loginDate && !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
            const isAdminDormente = isAdmin && account.status === 'Ativo' && isDormant;
            
            if (isAdminDormente) {
                if (!accountExceptionsSet.has(`${account.id}_DORMANT_ADMIN`)) {
                    divergenceDetails.push({ 
                        code: 'DORMANT_ADMIN', 
                        text: 'Conta de Administrador Dormente (sem login há mais de 90 dias).',
                        rhData: rhUser,
                        appData: account
                    });
                    hasAnyDivergence = true; 
                }
            }
            
            // --- INÍCIO DA CORREÇÃO (Lógica de Criticidade) ---
            // A regra agora é simples: é crítico se tem *qualquer* divergência E é admin.
            const isCritical = hasAnyDivergence && isAdmin;
            // --- FIM DA CORREÇÃO ---
            
            // Objeto final para contas de APP
            return {
                id: account.id, 
                identityId: account.identityId,
                name: account.name,
                email: account.email,
                userType: account.userType,
                perfil: perfilString, // <<< Usa a variável calculada
                rh_status: rhUser?.status || (isOrphan ? 'Não encontrado' : 'N/A'),
                app_status: account.status || 'N/A', 
                sourceSystem: account.system.name,
                divergence: hasAnyDivergence,
                isCritical: isCritical, // <<< Usa a nova lógica
                divergenceDetails: divergenceDetails,
                id_user: account.accountIdInSystem,
                cpf: account.cpf,
                last_login: loginDateStr,
                rhData: rhUser || null,
            };
        });
        
        // --- Etapa 5: (ACCESS_NOT_GRANTED) ---
        const missingAccessUsers = [];
        const activeRhIdentities = rhIdentities.filter(rhId => rhId.status === 'Ativo');

        const createMissingUserEntry = (rhUser, missingSystem) => {
            const divergenceDetails = [{ 
                code: 'ACCESS_NOT_GRANTED', 
                text: `Acesso Previsto Não Concedido: Usuário ativo no RH, mas sem conta em ${missingSystem}.`,
                rhData: rhUser,
                appData: null,
                targetSystem: missingSystem
            }];
            
            // --- INÍCIO DA CORREÇÃO (Criticidade de Identidade) ---
            // A "identidade" é admin se seu 'userType' contiver "admin"
            const isAdmin = (rhUser.userType || '').toLowerCase().includes('admin');
            // A divergência é 'ACCESS_NOT_GRANTED', então hasAnyDivergence = true
            const isCritical = isAdmin; // Se é admin e falta acesso, é crítico.
            // --- FIM DA CORREÇÃO ---

            return {
                id: `${rhUser.id}-${missingSystem}`, 
                identityId: rhUser.id,
                name: rhUser.name,
                email: rhUser.email,
                userType: rhUser.userType,
                perfil: 'N/A', // Não tem perfil de app
                rh_status: rhUser.status,
                app_status: 'Não encontrado',
                sourceSystem: missingSystem, 
                divergence: true, 
                isCritical: isCritical, // <<< Usa a nova lógica
                divergenceDetails: divergenceDetails,
                id_user: rhUser.identityId,
                cpf: rhUser.cpf,
                last_login: null,
                rhData: rhUser, 
            };
        };

        if (isGeneral) {
            const allAppSystems = await prisma.system.findMany({ 
                where: { name: { not: 'RH' } }, 
                select: { id: true, name: true } 
            }); 
            const allAccounts = await prisma.account.findMany({ 
                 where: { identityId: { not: null } },
                 select: { identityId: true, systemId: true } 
            });
            
            const identitySystemMap = allAccounts.reduce((map, acc) => {
                if (!map.has(acc.identityId)) {
                    map.set(acc.identityId, new Set());
                }
                map.get(acc.identityId).add(acc.systemId);
                return map;
            }, new Map());
            
            for (const sys of allAppSystems) {
                 activeRhIdentities.forEach(rhUser => {
                     const hasAccountInSystem = identitySystemMap.get(rhUser.id)?.has(sys.id);
                      if (!hasAccountInSystem && !identityExceptionsSet.has(`${rhUser.id}_ACCESS_NOT_GRANTED_${sys.name}`)) {
                           missingAccessUsers.push(createMissingUserEntry(rhUser, sys.name));
                       }
                 });
            }
        } else if (system && system.toUpperCase() !== 'RH' && systemRecord) {
             const identityIdsInThisSystem = new Set(systemAccounts.map(acc => acc.identityId).filter(id => id !== null));
             
             activeRhIdentities.forEach(rhUser => {
                  if (!identityIdsInThisSystem.has(rhUser.id) && !identityExceptionsSet.has(`${rhUser.id}_ACCESS_NOT_GRANTED_${system}`)) {
                       missingAccessUsers.push(createMissingUserEntry(rhUser, system));
                   }
             });
        }
        
        // --- Etapa 6: Combinar os resultados ---
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