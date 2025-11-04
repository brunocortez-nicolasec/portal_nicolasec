// node-api/src/services/metrics/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Função auxiliar para limpar texto
const cleanText = (text) => text?.trim().toLowerCase();
// Função auxiliar para limpar CPF
const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

// --- INÍCIO DA ADIÇÃO (FUNÇÃO HELPER DE ATRIBUTO) ---
const checkAttributeMatch = (operator, userValue, ruleValue) => {
  if (userValue === null || userValue === undefined || ruleValue === null || ruleValue === undefined) {
    return false;
  }
  const u = String(userValue).toLowerCase();
  const r = String(ruleValue).toLowerCase();
  
  switch (operator) {
    case 'equals':
      return u === r;
    case 'not_equals':
      return u !== r;
    case 'contains':
      return u.includes(r);
    case 'starts_with':
      return u.startsWith(r);
    case 'ends_with':
      return u.endsWith(r);
    default:
      return false;
  }
};
// --- FIM DA ADIÇÃO ---

const getSystemMetrics = async (req, res) => {
    const { system } = req.params; // Nome do Sistema (ex: "RH", "DOTAX", "Geral")
    const isGeneral = system.toLowerCase() === 'geral';

    // Garante userId Int
    const userIdInt = parseInt(req.user.id, 10);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
    }

    try {
        // --- INÍCIO DA REESTRUTURAÇÃO ---

        // 1. Buscar TODAS as Identidades (RH)
        const rhIdentities = await prisma.identity.findMany({
            where: { 
                sourceSystem: { equals: 'RH', mode: 'insensitive' },
            },
        });
        
        // Mapeia identidades por CPF e Email para buscas rápidas
        const rhMapByCpf = new Map(rhIdentities.filter(i => i.cpf).map(i => [cleanCpf(i.cpf), i]));
        const rhMapByEmail = new Map(rhIdentities.filter(i => i.email).map(i => [cleanText(i.email), i]));

        // 2. Buscar as Contas (Accounts) relevantes
        const whereAccounts = {};
        let targetSystemName = system; // Usado para exceções
        let systemRecord = null; // Armazena dados do sistema específico

        if (!isGeneral) {
            systemRecord = await prisma.system.findUnique({
                 where: { name: system },
                 select: { id: true }
            });
            
            if (!systemRecord) {
                 if(system.toUpperCase() !== 'RH') {
                     console.warn(`Sistema ${system} não encontrado para métricas.`);
                     return res.status(404).json({ message: `Sistema "${system}" não encontrado.`});
                 }
            } else {
                 whereAccounts.systemId = systemRecord.id;
            }
        }

        let systemAccounts = [];
        if (system.toUpperCase() !== 'RH') {
            systemAccounts = await prisma.account.findMany({
                where: whereAccounts,
                include: {
                    profiles: {
                        include: {
                            profile: {
                                select: { id: true, name: true }
                            }
                        }
                    },
                    system: {
                        select: { id: true, name: true }
                    }
                },
            });
        }
        
        if (system.toUpperCase() === 'RH') {
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
                 profiles: [],
             }));
        }
        
        // --- FIM DA REESTRUTURAÇÃO DA BUSCA ---

        // 3. Calcular Métricas

        if (!isGeneral && system.toUpperCase() !== 'RH' && systemAccounts.length === 0) {
             const zeroMetrics = {
                 pills: { total: 0, ativos: 0, inativos: 0, desconhecido: 0 },
                 tiposDeUsuario: [],
                 kpisAdicionais: { contasDormentes: 0, acessoPrivilegiado: 0, adminsDormentes: 0 },
                 divergencias: { inativosRHAtivosApp: 0, cpf: 0, nome: 0, email: 0, acessoPrevistoNaoConcedido: 0, ativosNaoEncontradosRH: 0, sodViolations: 0 }, 
                 pamRiscos: { acessosIndevidos: 0 },
                 riscos: { prejuizoPotencial: 'R$ 0', valorMitigado: 'R$ 0', indiceConformidade: 100.0, prejuizoBreakdown: [], riscosEmContasPrivilegiadas: 0, sodViolationCount: 0 }, 
             };
             return res.status(200).json(zeroMetrics);
        }

        const total = systemAccounts.length;
        const active = systemAccounts.filter(acc => acc.status === 'Ativo').length;
        const inactive = systemAccounts.filter(acc => acc.status === 'Inativo').length;
        const unknown = total - (active + inactive);

        const byUserType = systemAccounts.reduce((acc, account) => {
            const key = account.userType || 'Não categorizado';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // --- INÍCIO DA CORREÇÃO 1 ---
        // Acesso privilegiado (kpiAdicional) SÓ conta perfis (e usa 'includes' minúsculo)
        const acessoPrivilegiado = systemAccounts.filter(acc =>
            acc.status === 'Ativo' &&
            acc.profiles.some(p => p.profile.name.toLowerCase().includes('admin'))
        ).length;
        // --- FIM DA CORREÇÃO 1 ---

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let contasDormentes = 0;
        let adminsDormentes = 0;

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
        
        // 3. Buscar Regras de SOD (TODOS OS TIPOS)
        const sodWhere = {}; 
        
        if (isGeneral) {
            // "Geral": Busca todas as regras
        } else if (system.toUpperCase() !== 'RH' && systemRecord) {
            // "Específico": Busca regras do sistema E regras globais
            sodWhere.OR = [
                { systemId: systemRecord.id },
                { systemId: null }
            ];
        }

        const activeSodRules = (system && system.toUpperCase() !== 'RH')
            ? await prisma.sodRule.findMany({
                where: sodWhere,
                select: { 
                    ruleType: true,
                    valueAId: true,
                    valueAOperator: true,
                    valueAValue: true,
                    valueBType: true,
                    valueBId: true, 
                    systemId: true 
                }
              })
            : []; 
        
        const rulesBySystemId = activeSodRules.reduce((acc, rule) => {
            const key = rule.systemId;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(rule);
            return acc;
        }, {});
        
        const globalRules = rulesBySystemId[null] || [];

        let inativosRHAtivosAppCount = 0;
        let divergenciaCpfCount = 0;
        let divergenciaNomeCount = 0;
        let divergenciaEmailCount = 0;
        let naoEncontradosRHCount = 0; // Contas Órfãs
        const adminsComDivergencia = new Set();
        const divergentAccountIds = new Set();
        const sodViolators = new Set(); 

        // Loop principal
        for (const account of systemAccounts) {
            if (account.system.name.toUpperCase() === 'RH') continue;

            const rhEquivalent = (account.cpf && rhMapByCpf.get(cleanCpf(account.cpf))) ||
                                 (account.email && rhMapByEmail.get(cleanText(account.email)));
            
            let hasDivergence = false;
            
            // --- INÍCIO DA CORREÇÃO 2 (BUG 6 vs 4) ---
            // 'isAdmin' agora é definido APENAS pelos perfis da conta.
            const isAdmin = account.profiles.some(p => p.profile.name.toLowerCase().includes('admin'));
            // --- FIM DA CORREÇÃO 2 ---
            
            if (!rhEquivalent) {
                if (!accountExceptionsSet.has(`${account.id}_ORPHAN_ACCOUNT`)) {
                    naoEncontradosRHCount++;
                    hasDivergence = true;
                }
            } else {
                const { status: rhStatus, cpf: rhCpf, name: rhName, email: rhEmail, userType: rhUserType } = rhEquivalent;
                
                if (account.status === 'Ativo' && rhStatus === 'Inativo' && !accountExceptionsSet.has(`${account.id}_ZOMBIE_ACCOUNT`)) {
                    inativosRHAtivosAppCount++;
                    hasDivergence = true;
                }
                if (account.cpf && rhCpf && cleanCpf(account.cpf) !== cleanCpf(rhCpf) && !accountExceptionsSet.has(`${account.id}_CPF_MISMATCH`)) {
                    divergenciaCpfCount++;
                    hasDivergence = true;
                }
                if (account.name && rhName && cleanText(account.name) !== cleanText(rhName) && !accountExceptionsSet.has(`${account.id}_NAME_MISMATCH`)) {
                    divergenciaNomeCount++;
                    hasDivergence = true;
                }
                if (account.email && rhEmail && cleanText(account.email) !== cleanText(rhEmail) && !accountExceptionsSet.has(`${account.id}_EMAIL_MISMATCH`)) {
                    divergenciaEmailCount++;
                    hasDivergence = true;
                }
                 if (account.userType && rhUserType && cleanText(account.userType) !== cleanText(rhUserType) && !accountExceptionsSet.has(`${account.id}_USERTYPE_MISMATCH`)) {
                    hasDivergence = true;
                 }
            }

            // Lógica de Dormência
            const loginDateStr = account.extraData?.last_login;
            if (account.status === 'Ativo' && loginDateStr) {
                const loginDate = new Date(loginDateStr);
                if (!isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo) {
                    contasDormentes++;
                    if (isAdmin && !accountExceptionsSet.has(`${account.id}_DORMANT_ADMIN`)) {
                        adminsDormentes++;
                        hasDivergence = true;
                    }
                }
            }

            const systemSpecificRules = rulesBySystemId[account.systemId] || [];
            const applicableSodRules = [...systemSpecificRules, ...globalRules];

            if (applicableSodRules.length > 0) {
                if (!accountExceptionsSet.has(`${account.id}_SOD_VIOLATION`)) {
                    const accountProfileIds = new Set(account.profiles.map(p => p.profile.id));
                    
                    for (const rule of applicableSodRules) {
                        let violationFound = false;

                        if (rule.ruleType === 'ROLE_X_ROLE') {
                            if (accountProfileIds.size < 2) continue;
                            const ruleProfileId1 = parseInt(rule.valueAId, 10);
                            const ruleProfileId2 = parseInt(rule.valueBId, 10);

                            if (isNaN(ruleProfileId1) || isNaN(ruleProfileId2)) continue; 
                            if (accountProfileIds.has(ruleProfileId1) && accountProfileIds.has(ruleProfileId2)) {
                                violationFound = true;
                            }
                        }
                        
                        else if (rule.ruleType === 'ATTR_X_ROLE') {
                            if (!rhEquivalent) continue; 

                            const attributeName = rule.valueAId; 
                            const attributeOperator = rule.valueAOperator; 
                            const ruleValue = rule.valueAValue; 
                            const conflictingProfileId = parseInt(rule.valueBId, 10);
                            
                            if (isNaN(conflictingProfileId) || !attributeName || !ruleValue) continue;

                            const userValue = rhEquivalent[attributeName];
                            
                            const attributeMatch = checkAttributeMatch(attributeOperator, userValue, ruleValue);
                            
                            if (attributeMatch && accountProfileIds.has(conflictingProfileId)) {
                                violationFound = true;
                            }
                        }

                        if (violationFound) {
                            sodViolators.add(account.id);
                            hasDivergence = true;
                            break; 
                        }
                    }
                }
            }

            if (hasDivergence) {
                divergentAccountIds.add(account.id);
            }

            if (isAdmin && hasDivergence) {
                adminsComDivergencia.add(account.id);
            }
        } // Fim do loop for(systemAccounts)

        const sodViolationCount = sodViolators.size;
        
        let acessoPrevistoNaoConcedidoCount = 0;
        const activeRhIdentities = rhIdentities.filter(rhId => rhId.status === 'Ativo');
        
        if (isGeneral) {
            const systemsInAccounts = await prisma.system.findMany({ 
                where: { name: { not: 'RH' } }, 
                select: { id: true, name: true } 
            }); 
            const allAccounts = await prisma.account.findMany({ 
                 where: { identityId: { not: null } },
                 select: { identityId: true, systemId: true } 
            }); 
            
            const accountsByIdentity = allAccounts.reduce((acc, account) => {
                 if (!acc[account.identityId]) acc[account.identityId] = new Set();
                 acc[account.identityId].add(account.systemId);
                 return acc;
            }, {});

            for (const sys of systemsInAccounts) {
                const accountsInThisSystem = new Set(
                    allAccounts.filter(a => a.systemId === sys.id).map(a => a.identityId)
                );
                 
                 activeRhIdentities.forEach(rhIdentity => {
                     const isMissing = !accountsInThisSystem.has(rhIdentity.id);
                     const isExcepted = identityExceptionsSet.has(`${rhIdentity.id}_ACCESS_NOT_GRANTED_${sys.name}`);
                     if (isMissing && !isExcepted) {
                         acessoPrevistoNaoConcedidoCount++;
                     }
                 });
            }

        } else if (system.toUpperCase() !== 'RH' && systemRecord) {
             const identityIdsInThisSystem = new Set(systemAccounts.map(acc => acc.identityId).filter(id => id !== null));
             
             activeRhIdentities.forEach(rhIdentity => {
                 const isMissing = !identityIdsInThisSystem.has(rhIdentity.id);
                 const isExcepted = identityExceptionsSet.has(`${rhIdentity.id}_ACCESS_NOT_GRANTED_${system}`);
                 if (isMissing && !isExcepted) {
                     acessoPrevistoNaoConcedidoCount++;
                 }
             });
        }
        
        const CUSTOS_DE_RISCO = {
            CRITICO: 10000,
            PRIVILEGIO: 7500,
            CONFORMIDADE: 3000,
            PRODUTIVIDADE: 1500,
            OPERACIONAL: 500,
            SOD: 8000, 
        };

        const conformidadeCount = divergenciaCpfCount;
        const operacionalCount = divergenciaNomeCount + divergenciaEmailCount;
        const criticoCount = inativosRHAtivosAppCount + naoEncontradosRHCount;

        const prejuizoCalculado = 
            (criticoCount * CUSTOS_DE_RISCO.CRITICO) +
            (adminsComDivergencia.size * CUSTOS_DE_RISCO.PRIVILEGIO) +
            (conformidadeCount * CUSTOS_DE_RISCO.CONFORMIDADE) +
            (acessoPrevistoNaoConcedidoCount * CUSTOS_DE_RISCO.PRODUTIVIDADE) +
            (operacionalCount * CUSTOS_DE_RISCO.OPERACIONAL) +
            (sodViolationCount * CUSTOS_DE_RISCO.SOD); 

        const valorMitigado = prejuizoCalculado * 0.95;
        
        const totalDivergentSystemUsers = divergentAccountIds.size;
        
        const totalPopulation = total;
        const totalUniqueDivergentItems = totalDivergentSystemUsers; 
        
        const calculatedIndex = totalPopulation > 0 
            ? ((totalPopulation - totalUniqueDivergentItems) / totalPopulation) * 100 
            : 100;
        const indiceConformidade = calculatedIndex.toFixed(1);
        
        const prejuizoBreakdown = [
            { label: "Risco Crítico (Contas Órfãs e Zumbis)", count: criticoCount, costPerUnit: CUSTOS_DE_RISCO.CRITICO, subTotal: criticoCount * CUSTOS_DE_RISCO.CRITICO },
            { label: "Risco Elevado (Privilégio)", count: adminsComDivergencia.size, costPerUnit: CUSTOS_DE_RISCO.PRIVILEGIO, subTotal: adminsComDivergencia.size * CUSTOS_DE_RISCO.PRIVILEGIO },
            { label: "Risco de Segregação de Função (SoD)", count: sodViolationCount, costPerUnit: CUSTOS_DE_RISCO.SOD, subTotal: sodViolationCount * CUSTOS_DE_RISCO.SOD }, 
            { label: "Risco de Conformidade (CPF)", count: conformidadeCount, costPerUnit: CUSTOS_DE_RISCO.CONFORMIDADE, subTotal: conformidadeCount * CUSTOS_DE_RISCO.CONFORMIDADE },
            { label: "Risco de Produtividade (Acesso Não Concedido)", count: acessoPrevistoNaoConcedidoCount, costPerUnit: CUSTOS_DE_RISCO.PRODUTIVIDADE, subTotal: acessoPrevistoNaoConcedidoCount * CUSTOS_DE_RISCO.PRODUTIVIDADE },
            { label: "Risco Operacional (Nome, E-mail)", count: operacionalCount, costPerUnit: CUSTOS_DE_RISCO.OPERACIONAL, subTotal: operacionalCount * CUSTOS_DE_RISCO.OPERACIONAL },
        ];
        
        const metrics = {
            pills: { total, ativos: active, inativos: inactive, desconhecido: unknown },
            tiposDeUsuario: Object.entries(byUserType).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total),
            kpisAdicionais: { contasDormentes, acessoPrivilegiado, adminsDormentes },
            divergencias: {
                inativosRHAtivosApp: inativosRHAtivosAppCount,
                cpf: divergenciaCpfCount,
                nome: divergenciaNomeCount,
                email: divergenciaEmailCount,
                acessoPrevistoNaoConcedido: acessoPrevistoNaoConcedidoCount,
                ativosNaoEncontradosRH: naoEncontradosRHCount,
                sodViolations: sodViolationCount,
            },
            pamRiscos: { acessosIndevidos: 0 },
            riscos: {
                prejuizoPotencial: `R$ ${prejuizoCalculado.toLocaleString('pt-BR')}`,
                valorMitigado: `R$ ${valorMitigado.toLocaleString('pt-BR')}`,
                indiceConformidade: parseFloat(indiceConformidade),
                prejuizoBreakdown: prejuizoBreakdown.filter(b => b.count > 0),
                riscosEmContasPrivilegiadas: adminsComDivergencia.size,
                sodViolationCount: sodViolationCount,
            },
        };
        
        return res.status(200).json(metrics);

    } catch (error) {
        console.error(`Erro ao calcular métricas para o sistema ${system}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor ao calcular métricas." });
    }
};

router.get(
    "/:system",
    passport.authenticate("jwt", { session: false }),
    getSystemMetrics
);

export default router;