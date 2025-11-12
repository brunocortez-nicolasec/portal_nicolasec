// node-api/src/services/metrics/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Função auxiliar para limpar texto
const cleanText = (text) => text?.trim().toLowerCase();

// Esta função auxiliar NÃO é mais necessária para SoD, pois o schema não possui as regras.
// Mantida caso você queira reutilizar a lógica de atributo no futuro.
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

const getSystemMetrics = async (req, res) => {
    const { system } = req.params; // Nome do Sistema (ex: "SAP", "RH", "Geral")
    const isGeneral = system.toLowerCase() === 'geral';

    const userIdInt = parseInt(req.user.id, 10);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
    }

    try {
      // Usaremos uma transação para garantir que os dados sejam consistentes
      const metrics = await prisma.$transaction(async (tx) => {

        // 1. Buscar TODAS as Identidades (RH) do usuário
        // Esta é a nossa "Fonte da Verdade"
        const rhIdentities = await tx.identitiesHR.findMany({
            where: { 
                dataSource: { 
                    userId: userIdInt,
                    origem_datasource: 'RH'
                }
            },
        });
        
        // Mapeia identidades pelo ID (PK) para buscas rápidas
        const rhMapById = new Map(rhIdentities.map(i => [i.id, i]));

        // 2. Definir o filtro do sistema
        const systemFilter = {};
        let systemRecord = null; // Armazena dados do sistema específico

        if (!isGeneral && system.toUpperCase() !== 'RH') {
// ======================= INÍCIO DA CORREÇÃO (Bug 500) =======================
            systemRecord = await tx.system.findUnique({
                where: { name_system: system }, // CORRIGIDO: de 'name' para 'name_system'
                select: { id: true }
            });
// ======================== FIM DA CORREÇÃO (Bug 500) =========================
            
            if (!systemRecord) {
                console.warn(`Sistema ${system} não encontrado para métricas.`);
                // Retornamos 404, mas o front-end trata como "Erro de Rede"
                throw new Error(`Sistema "${system}" não encontrado.`);
            }
            
            systemFilter.systemId = systemRecord.id;
        }
        
        // 3. Buscar as Contas (Accounts) relevantes
        let allAccounts = [];
        if (system.toUpperCase() !== 'RH') {
            allAccounts = await tx.accounts.findMany({
                where: {
                    system: {
                        dataSourcesConfigs: { some: { dataSource: { userId: userIdInt } } },
                    },
                    ...systemFilter // Aplica o filtro de systemId (ex: "SAP")
                },
                include: {
                    identity: true, // Inclui a IdentidadeHR (RH) vinculada
                    system: { select: { name_system: true, id: true } },
                    assignments: { // Inclui as atribuições
                        include: {
                            resource: true // Inclui os Recursos (Perfis)
                        }
                    }
                },
            });
        }

        // Se o usuário selecionou "RH" no filtro, simulamos as identidades como "contas"
        if (system.toUpperCase() === 'RH') {
            allAccounts = rhIdentities.map(id => ({
                id: id.id,
                id_in_system_account: id.identity_id_hr,
                name_account: id.name_hr,
                email_account: id.email_hr,
                status_account: id.status_hr,
                user_type_account: id.user_type_hr,
                extra_data_account: id.extra_data_hr,
                identityId: id.id,
                systemId: null,
                system: { name_system: 'RH', id: null },
                identity: id, // A identidade é ela mesma
                assignments: [], // RH não tem "recursos" neste contexto
            }));
        }
        
        // Se não for "Geral" e não for "RH" e não achou contas, retorna zerado
        if (!isGeneral && system.toUpperCase() !== 'RH' && allAccounts.length === 0) {
            const zeroMetrics = {
                pills: { total: 0, ativos: 0, inativos: 0, desconhecido: 0 },
                tiposDeUsuario: [],
                kpisAdicionais: { contasDormentes: 0, acessoPrivilegiado: 0, adminsDormentes: 0 },
                divergencias: { inativosRHAtivosApp: 0, cpf: 0, nome: 0, email: 0, acessoPrevistoNaoConcedido: 0, ativosNaoEncontradosRH: 0, sodViolations: 0 }, 
                pamRiscos: { acessosIndevidos: 0 },
                riscos: { prejuizoPotencial: 'R$ 0,00', valorMitigado: 'R$ 0,00', indiceConformidade: 100.0, prejuizoBreakdown: [], riscosEmContasPrivilegiadas: 0, sodViolationCount: 0 }, 
            };
            return zeroMetrics;
        }

        // 4. Calcular Métricas de Visão Geral (Pills e Gráfico de Pizza)
        const total = allAccounts.length;
        const active = allAccounts.filter(acc => acc.status_account === 'Ativo').length;
        const inactive = allAccounts.filter(acc => acc.status_account === 'Inativo').length;
        const unknown = total - (active + inactive);

        const byUserType = allAccounts.reduce((acc, account) => {
            const key = account.identity?.user_type_hr || 'Não categorizado';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // 5. Calcular KPIs Adicionais
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let contasDormentes = 0;
        let adminsDormentes = 0;
        const adminsComDivergencia = new Set();
        const divergentAccountIds = new Set();

        const acessoPrivilegiado = allAccounts.filter(acc =>
            acc.status_account === 'Ativo' &&
            acc.assignments.some(a => a.resource.name_resource.toLowerCase().includes('admin'))
        ).length;

        // 6. Calcular Divergências (Loop Principal)
        let inativosRHAtivosAppCount = 0; // Zumbi
// ======================= INÍCIO DA CORREÇÃO (Bug Lógica) =======================
        let naoEncontradosRHCount = 0; // Contas Órfãs (declarado como 'let')
// ======================== FIM DA CORREÇÃO (Bug Lógica) =========================
        
        for (const account of allAccounts) {
            if (account.system.name_system.toUpperCase() === 'RH') continue;

            const rhEquivalent = account.identity; 
            let hasDivergence = false;
            
            const isAdmin = account.assignments.some(a => a.resource.name_resource.toLowerCase().includes('admin'));
            
            if (rhEquivalent) {
                const { status_hr: rhStatus } = rhEquivalent;
                
                if (account.status_account === 'Ativo' && rhStatus === 'Inativo') {
                    inativosRHAtivosAppCount++;
                    hasDivergence = true;
                }
                
                const loginDateStr = account.extra_data_account?.last_login;
                if (account.status_account === 'Ativo' && loginDateStr) {
                    const loginDate = new Date(loginDateStr);
                    if (!isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo) {
                        contasDormentes++;
                        if (isAdmin) {
                            adminsDormentes++;
                            hasDivergence = true;
                        }
                    }
                }

            } else {
                // CONTA ÓRFÃ: (naoEncontradosRHCount)
// ======================= INÍCIO DA CORREÇÃO (Bug Lógica) =======================
                // Nossa lógica de importação previne isso, mas é seguro contar.
                naoEncontradosRHCount++; 
                hasDivergence = true;
// ======================== FIM DA CORREÇÃO (Bug Lógica) =========================
            }
            
            // Lógica de SoD removida (tabela SodRule não existe no schema.prisma)
            
            if (hasDivergence) {
                divergentAccountIds.add(account.id);
            }

            if (isAdmin && hasDivergence) {
                adminsComDivergencia.add(account.id);
            }
        } // Fim do loop for(allAccounts)

        // 7. Calcular Acesso Previsto Não Concedido
        let acessoPrevistoNaoConcedidoCount = 0;
        const activeRhIdentities = rhIdentities.filter(rhId => rhId.status_hr === 'Ativo');
        
        const accountsByIdentity = allAccounts.reduce((acc, account) => {
             if (!account.identityId) return acc;
             if (!acc.has(account.identityId)) acc.set(account.identityId, new Set());
             acc.get(account.identityId).add(account.systemId);
             return acc;
        }, new Map());

        const allSystems = await tx.system.findMany({
            where: { 
                dataSourcesConfigs: { some: { dataSource: { userId: userIdInt } } },
                name_system: { not: 'RH' } 
            },
            select: { id: true, name_system: true } 
        });

        for (const sys of allSystems) {
            if (!isGeneral && sys.name_system !== system) continue;
            
            activeRhIdentities.forEach(rhIdentity => {
                const identitySystems = accountsByIdentity.get(rhIdentity.id);
                const hasAccountInSystem = identitySystems ? identitySystems.has(sys.id) : false;
                
                if (!hasAccountInSystem) {
                    acessoPrevistoNaoConcedidoCount++;
                }
            });
        }
        
        // 8. Métricas Obsoletas (Zeradas por Design)
        const divergenciaCpfCount = 0;
        const divergenciaNomeCount = 0;
        const divergenciaEmailCount = 0;
        // const naoEncontradosRHCount = 0; // <-- LINHA REMOVIDA
        const sodViolationCount = 0; // Regras de SoD não migradas

        // 9. Calcular Riscos Financeiros
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
        
        const calculatedIndex = totalPopulation > 0 
            ? ((totalPopulation - totalDivergentSystemUsers) / totalPopulation) * 100 
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
        
        // 10. Montar o objeto de retorno
        const finalMetrics = {
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
        
        return finalMetrics;
      }); // Fim da transação

      return res.status(200).json(metrics);

    } catch (error) {
        console.error(`Erro ao calcular métricas para o sistema ${system}:`, error);
        return res.status(500).json({ message: error.message || "Erro interno do servidor ao calcular métricas." });
    }
};

router.get(
    "/:system",
    passport.authenticate("jwt", { session: false }),
    getSystemMetrics
);

export default router;