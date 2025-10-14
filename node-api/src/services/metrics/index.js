// node-api/src/services/metrics/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const getSystemMetrics = async (req, res) => {
    const { system } = req.params;
    const isGeneral = system.toLowerCase() === 'geral';

    try {
        const [systemIdentities, rhIdentities, userExceptions] = await Promise.all([
            prisma.identity.findMany({
                where: isGeneral 
                    ? { sourceSystem: { not: 'RH' } } 
                    : { sourceSystem: { equals: system, mode: 'insensitive' } },
                include: { profile: true },
            }),
            prisma.identity.findMany({
                where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
            }),
            prisma.divergenceException.findMany({
                where: { userId: req.user.id },
            }),
        ]);

        if (!isGeneral && systemIdentities.length === 0) {
            const zeroMetrics = {
                pills: { total: 0, ativos: 0, inativos: 0, desconhecido: 0 },
                tiposDeUsuario: [],
                kpisAdicionais: { contasDormentes: 0, acessoPrivilegiado: 0, adminsDormentes: 0 },
                divergencias: { inativosRHAtivosApp: 0, cpf: 0, nome: 0, email: 0, acessoPrevistoNaoConcedido: 0, ativosNaoEncontradosRH: 0 },
                pamRiscos: { acessosIndevidos: 0 },
                riscos: { prejuizoPotencial: 'R$ 0', valorMitigado: 'R$ 0', indiceConformidade: 100.0, prejuizoBreakdown: [], riscosEmContasPrivilegiadas: 0 },
            };
            return res.status(200).json(zeroMetrics);
        }

        const total = systemIdentities.length;
        const active = systemIdentities.filter(i => i.status === 'Ativo').length;
        const inactive = systemIdentities.filter(i => i.status === 'Inativo').length;
        const unknown = total - (active + inactive);
        const byUserType = systemIdentities.reduce((acc, identity) => {
            const key = identity.userType || 'Não categorizado';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const acessoPrivilegiado = systemIdentities.filter(i => i.status === 'Ativo' && i.profile?.name === 'Admin').length;
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let contasDormentes = 0;
        let adminsDormentes = 0;

        const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
        
        const exceptionsSet = new Set(
            userExceptions.map(ex => `${ex.identityId}_${ex.divergenceCode}_${ex.targetSystem || 'null'}`)
        );

        let inativosRHAtivosAppCount = 0;
        let divergenciaCpfCount = 0;
        let divergenciaNomeCount = 0;
        let divergenciaEmailCount = 0;
        let naoEncontradosRHCount = 0;
        const adminsComDivergencia = new Set();
        const divergentSystemIdentities = new Set();
        const cleanText = (text) => text?.trim().toLowerCase();
        const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

        systemIdentities.forEach(identity => {
            const rhEquivalent = rhMap.get(identity.identityId);
            let hasDivergence = false;
            const isAdmin = identity.profile?.name === 'Admin';

            if (!rhEquivalent) {
                if (!exceptionsSet.has(`${identity.id}_ORPHAN_ACCOUNT_null`)) {
                    naoEncontradosRHCount++;
                    hasDivergence = true;
                }
            } else {
                if (identity.status === 'Ativo' && rhEquivalent.status === 'Inativo' && !exceptionsSet.has(`${identity.id}_ZOMBIE_ACCOUNT_null`)) {
                    inativosRHAtivosAppCount++;
                    hasDivergence = true;
                }
                if (identity.cpf && rhEquivalent.cpf && cleanCpf(identity.cpf) !== cleanCpf(rhEquivalent.cpf) && !exceptionsSet.has(`${identity.id}_CPF_MISMATCH_null`)) {
                    divergenciaCpfCount++;
                    hasDivergence = true;
                }
                if (identity.name && rhEquivalent.name && cleanText(identity.name) !== cleanText(rhEquivalent.name) && !exceptionsSet.has(`${identity.id}_NAME_MISMATCH_null`)) {
                    divergenciaNomeCount++;
                    hasDivergence = true;
                }
                if (identity.email && rhEquivalent.email && cleanText(identity.email) !== cleanText(rhEquivalent.email) && !exceptionsSet.has(`${identity.id}_EMAIL_MISMATCH_null`)) {
                    divergenciaEmailCount++;
                    hasDivergence = true;
                }
                if (identity.userType && rhEquivalent.userType && cleanText(identity.userType) !== cleanText(rhEquivalent.userType) && !exceptionsSet.has(`${identity.id}_USERTYPE_MISMATCH_null`)) {
                    hasDivergence = true;
                }
            }

            const loginDateStr = identity.extraData?.last_login;
            if (identity.status === 'Ativo' && loginDateStr) {
                const loginDate = new Date(loginDateStr);
                if (!isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo) {
                    contasDormentes++;
                    if (isAdmin && !exceptionsSet.has(`${identity.id}_DORMANT_ADMIN_null`)) {
                        adminsDormentes++;
                        hasDivergence = true;
                    }
                }
            }

            if (hasDivergence) {
                divergentSystemIdentities.add(identity.identityId);
            }

            if (isAdmin && hasDivergence) {
                adminsComDivergencia.add(identity.id);
            }
        });
        
        let acessoPrevistoNaoConcedidoCount = 0;
        const activeRhIdentities = rhIdentities.filter(rhId => rhId.status === 'Ativo');
        
        if (isGeneral) {
            const identitiesBySystem = systemIdentities.reduce((acc, identity) => {
                const systemKey = identity.sourceSystem;
                if (!acc[systemKey]) acc[systemKey] = [];
                acc[systemKey].push(identity);
                return acc;
            }, {});
            for (const systemName in identitiesBySystem) {
                const systemSpecificIdentities = identitiesBySystem[systemName];
                const systemIdSet = new Set(systemSpecificIdentities.map(i => i.identityId));
                
                const missingInThisSystem = activeRhIdentities.filter(rhIdentity => {
                    const isMissing = !systemIdSet.has(rhIdentity.identityId);
                    const isExcepted = exceptionsSet.has(`${rhIdentity.id}_ACCESS_NOT_GRANTED_${systemName}`);
                    return isMissing && !isExcepted;
                });

                acessoPrevistoNaoConcedidoCount += missingInThisSystem.length;
                
                missingInThisSystem.forEach(rhUser => {
                    if (rhUser.profile?.name === 'Admin') adminsComDivergencia.add(rhUser.id);
                });
            }
        } else {
            const systemIdSet = new Set(systemIdentities.map(i => i.identityId));
            const missingUsers = activeRhIdentities.filter(rhIdentity => {
                const isMissing = !systemIdSet.has(rhIdentity.identityId);
                const isExcepted = exceptionsSet.has(`${rhIdentity.id}_ACCESS_NOT_GRANTED_${system}`);
                return isMissing && !isExcepted;
            });
            acessoPrevistoNaoConcedidoCount = missingUsers.length;
            missingUsers.forEach(rhUser => {
                if (rhUser.profile?.name === 'Admin') adminsComDivergencia.add(rhUser.id);
            });
        }

        // <<< ALTERAÇÃO 1: NOVOS CUSTOS DE RISCO, MAIS REALISTAS >>>
        const CUSTOS_DE_RISCO = {
            CRITICO: 10000,       // Para Contas Zumbi e Órfãs
            PRIVILEGIO: 7500,     // Para Admins com qualquer tipo de risco
            CONFORMIDADE: 3000,   // Para divergência de CPF
            PRODUTIVIDADE: 1500,  // Para acessos não concedidos
            OPERACIONAL: 500      // Para divergência de Nome e E-mail
        };

        // <<< ALTERAÇÃO 2: NOVA FÓRMULA DE PREJUÍZO >>>
        // A fórmula agora considera todos os riscos, mesmo que haja exceções para as divergências
        // individuais, o risco inerente (ex: ser uma conta órfã) ainda é contabilizado.
        const prejuizoCalculado = 
            ((inativosRHAtivosAppCount + naoEncontradosRHCount) * CUSTOS_DE_RISCO.CRITICO) +
            (adminsComDivergencia.size * CUSTOS_DE_RISCO.PRIVILEGIO) +
            (divergenciaCpfCount * CUSTOS_DE_RISCO.CONFORMIDADE) +
            (acessoPrevistoNaoConcedidoCount * CUSTOS_DE_RISCO.PRODUTIVIDADE) +
            ((divergenciaNomeCount + divergenciaEmailCount) * CUSTOS_DE_RISCO.OPERACIONAL);

        const valorMitigado = prejuizoCalculado * 0.95;
        const totalDivergentSystemUsers = divergentSystemIdentities.size;
        const totalDivergentRhUsers = acessoPrevistoNaoConcedidoCount;
        const totalUniqueDivergentUsers = totalDivergentSystemUsers + totalDivergentRhUsers;
        const totalPopulation = total + totalDivergentRhUsers;
        const calculatedIndex = totalPopulation > 0 ? ((totalPopulation - totalUniqueDivergentUsers) / totalPopulation) * 100 : 100;
        const indiceConformidade = calculatedIndex.toFixed(1);
        
        // <<< ALTERAÇÃO 3: NOVO DETALHAMENTO DE PREJUÍZO >>>
        const conformidadeCount = divergenciaCpfCount;
        const operacionalCount = divergenciaNomeCount + divergenciaEmailCount;
        const criticoCount = inativosRHAtivosAppCount + naoEncontradosRHCount;
        const prejuizoBreakdown = [
            { label: "Risco Crítico (Contas Órfãs e Zumbis)", count: criticoCount, costPerUnit: CUSTOS_DE_RISCO.CRITICO, subTotal: criticoCount * CUSTOS_DE_RISCO.CRITICO },
            { label: "Risco Elevado (Privilégio)", count: adminsComDivergencia.size, costPerUnit: CUSTOS_DE_RISCO.PRIVILEGIO, subTotal: adminsComDivergencia.size * CUSTOS_DE_RISCO.PRIVILEGIO },
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
            },
            pamRiscos: { acessosIndevidos: 0 },
            riscos: {
                prejuizoPotencial: `R$ ${prejuizoCalculado.toLocaleString('pt-BR')}`,
                valorMitigado: `R$ ${valorMitigado.toLocaleString('pt-BR')}`,
                indiceConformidade: parseFloat(indiceConformidade),
                prejuizoBreakdown: prejuizoBreakdown,
                riscosEmContasPrivilegiadas: adminsComDivergencia.size,
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