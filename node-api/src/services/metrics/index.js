// node-api\src\services\metrics\index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const getSystemMetrics = async (req, res) => {
  const { system } = req.params;
  const isGeneral = system.toLowerCase() === 'geral';

  try {
    const [systemIdentities, rhIdentities] = await Promise.all([
      prisma.identity.findMany({
        where: isGeneral 
          ? { sourceSystem: { not: 'RH' } } 
          : { sourceSystem: { equals: system, mode: 'insensitive' } },
        include: { profile: { select: { name: true } } },
      }),
      prisma.identity.findMany({
        where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
        include: { profile: { select: { name: true } } },
      }),
    ]);

    // 2. Calcula as métricas simples
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
    
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    const dormantIdentities = systemIdentities.filter(i => {
      const loginDateStr = i.extraData?.last_login;
      if (i.status !== 'Ativo' || !loginDateStr) return false;
      const loginDate = new Date(loginDateStr);
      return !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
    });

    const contasDormentes = dormantIdentities.length;
    // Nova métrica para contar apenas admins dormentes
    const adminsDormentes = dormantIdentities.filter(i => i.profile?.name === 'Admin').length;
    // ======================== FIM DA ALTERAÇÃO =======================


    // 3. Calcula as métricas de Divergência e Risco
    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
    
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

      if (!rhEquivalent) {
        naoEncontradosRHCount++;
        hasDivergence = true;
      } else {
        if (identity.status === 'Ativo' && rhEquivalent.status === 'Inativo') { inativosRHAtivosAppCount++; hasDivergence = true; }
        if (identity.cpf && rhEquivalent.cpf && cleanCpf(identity.cpf) !== cleanCpf(rhEquivalent.cpf)) { divergenciaCpfCount++; hasDivergence = true; }
        if (identity.name && rhEquivalent.name && cleanText(identity.name) !== cleanText(rhEquivalent.name)) { divergenciaNomeCount++; hasDivergence = true; }
        if (identity.email && rhEquivalent.email && cleanText(identity.email) !== cleanText(rhEquivalent.email)) { divergenciaEmailCount++; hasDivergence = true; }
      }

      if (hasDivergence) {
        divergentSystemIdentities.add(identity.identityId);
      }

      if (identity.profile?.name === 'Admin' && hasDivergence) {
        adminsComDivergencia.add(identity.identityId);
      }
    });
    
    let acessoPrevistoNaoConcedidoCount = 0;
    const activeRhIdentities = rhIdentities.filter(rhId => rhId.status === 'Ativo');

    if (isGeneral) {
      const identitiesBySystem = systemIdentities.reduce((acc, identity) => {
        const systemKey = identity.sourceSystem;
        if (!acc[systemKey]) {
          acc[systemKey] = [];
        }
        acc[systemKey].push(identity);
        return acc;
      }, {});

      for (const systemName in identitiesBySystem) {
        const systemSpecificIdentities = identitiesBySystem[systemName];
        const systemIdSet = new Set(systemSpecificIdentities.map(i => i.identityId));
        const missingInThisSystem = activeRhIdentities.filter(rhIdentity => !systemIdSet.has(rhIdentity.identityId));
        
        acessoPrevistoNaoConcedidoCount += missingInThisSystem.length;
        
        missingInThisSystem.forEach(rhUser => {
          if (rhUser.profile?.name === 'Admin') {
            adminsComDivergencia.add(rhUser.identityId);
          }
        });
      }
    } else {
      const systemIdSet = new Set(systemIdentities.map(i => i.identityId));
      const missingUsers = activeRhIdentities.filter(rhIdentity => !systemIdSet.has(rhIdentity.identityId));
      acessoPrevistoNaoConcedidoCount = missingUsers.length;

      missingUsers.forEach(rhUser => {
        if (rhUser.profile?.name === 'Admin') {
            adminsComDivergencia.add(rhUser.identityId);
        }
      });
    }

    // 4. Calcula os KPIs financeiros e de conformidade
    const CUSTOS_DE_RISCO = { CRITICO: 25000, CONFORMIDADE: 5000, OPERACIONAL: 1000, PRODUTIVIDADE: 2500 };
    const prejuizoCalculado = (inativosRHAtivosAppCount * CUSTOS_DE_RISCO.CRITICO) + (divergenciaCpfCount * CUSTOS_DE_RISCO.CONFORMIDADE) + ((divergenciaNomeCount + divergenciaEmailCount) * CUSTOS_DE_RISCO.OPERACIONAL) + (acessoPrevistoNaoConcedidoCount * CUSTOS_DE_RISCO.PRODUTIVIDADE);
    const valorMitigado = prejuizoCalculado * 0.95;

    const totalDivergentSystemUsers = divergentSystemIdentities.size;
    const totalDivergentRhUsers = acessoPrevistoNaoConcedidoCount;
    const totalUniqueDivergentUsers = totalDivergentSystemUsers + totalDivergentRhUsers;

    const totalPopulation = total + totalDivergentRhUsers;

    const calculatedIndex = totalPopulation > 0 
      ? ((totalPopulation - totalUniqueDivergentUsers) / totalPopulation) * 100 
      : 100;
      
    const indiceConformidade = calculatedIndex.toFixed(1);

    const conformidadeCount = divergenciaCpfCount;
    const operacionalCount = divergenciaNomeCount + divergenciaEmailCount;

    const prejuizoBreakdown = [
      { label: "Risco Crítico (RH Inativo / App Ativo)", count: inativosRHAtivosAppCount, costPerUnit: CUSTOS_DE_RISCO.CRITICO, subTotal: inativosRHAtivosAppCount * CUSTOS_DE_RISCO.CRITICO },
      { label: "Risco de Conformidade (CPF)", count: conformidadeCount, costPerUnit: CUSTOS_DE_RISCO.CONFORMIDADE, subTotal: conformidadeCount * CUSTOS_DE_RISCO.CONFORMIDADE },
      { label: "Risco Operacional (Nome, E-mail)", count: operacionalCount, costPerUnit: CUSTOS_DE_RISCO.OPERACIONAL, subTotal: operacionalCount * CUSTOS_DE_RISCO.OPERACIONAL },
      { label: "Risco de Produtividade (Acesso Não Concedido)", count: acessoPrevistoNaoConcedidoCount, costPerUnit: CUSTOS_DE_RISCO.PRODUTIVIDADE, subTotal: acessoPrevistoNaoConcedidoCount * CUSTOS_DE_RISCO.PRODUTIVIDADE },
    ];

    // 5. Monta o objeto de resposta final
    const metrics = {
      pills: { total, ativos: active, inativos: inactive, desconhecido: unknown },
      tiposDeUsuario: Object.entries(byUserType).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total),
      // ======================= INÍCIO DA ALTERAÇÃO =======================
      // Adicionado 'adminsDormentes' ao objeto de kpisAdicionais
      kpisAdicionais: { contasDormentes, acessoPrivilegiado, adminsDormentes },
      // ======================== FIM DA ALTERAÇÃO =======================
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