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
    // 1. Busca os dados brutos necessários
    const [systemIdentities, rhIdentities] = await Promise.all([
      prisma.identity.findMany({
        // <<< ALTERAÇÃO AQUI
        where: isGeneral 
          ? { sourceSystem: { not: 'RH' } } 
          : { sourceSystem: { equals: system, mode: 'insensitive' } },
      }),
      // Sempre buscamos os dados do RH para fazer as comparações de divergência
      prisma.identity.findMany({
        where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
      }),
    ]);

    // 2. Calcula as métricas simples (Pills, Tipos de Usuário, etc.)
    const total = systemIdentities.length;
    const active = systemIdentities.filter(i => i.status === 'Ativo').length;
    const inactive = systemIdentities.filter(i => i.status === 'Inativo').length;
    const unknown = total - (active + inactive);
    
    const byUserType = systemIdentities.reduce((acc, identity) => {
        const key = identity.userType || 'Não categorizado';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const acessoPrivilegiado = systemIdentities.filter(i => i.status === 'Ativo' && i.extraData?.perfil === 'Admin').length;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const contasDormentes = systemIdentities.filter(i => {
      const loginDateStr = i.extraData?.ultimo_login;
      if (i.status !== 'Ativo' || !loginDateStr) return false;
      const loginDate = new Date(loginDateStr);
      return !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
    }).length;

    // 3. Calcula as métricas de Divergência e Risco
    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));
    let inativosRHAtivosAppCount = 0;
    
    // Itera sobre as identidades do sistema selecionado para encontrar divergências com o RH
    systemIdentities.forEach(identity => {
      const rhEquivalent = rhMap.get(identity.identityId);
      if (identity.status === 'Ativo' && rhEquivalent?.status === 'Inativo') {
        inativosRHAtivosAppCount++;
      }
    });
    
    // (Lógica para outras divergências pode ser adicionada aqui no futuro)
    const totalComDivergencia = inativosRHAtivosAppCount; 

    // 4. Calcula os KPIs financeiros e de conformidade
    const custoPorDivergencia = 25000;
    const prejuizoCalculado = inativosRHAtivosAppCount * custoPorDivergencia;
    const valorMitigado = prejuizoCalculado * 0.95;
    const indiceConformidade = total > 0 ? (((total - totalComDivergencia) / total) * 100).toFixed(1) : '100.0';

    // 5. Monta o objeto de resposta final
    const metrics = {
      pills: { total, ativos: active, inativos: inactive, desconhecido: unknown },
      tiposDeUsuario: Object.entries(byUserType).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total),
      kpisAdicionais: { contasDormentes, acessoPrivilegiado },
      divergencias: {
        inativosRHAtivosApp: inativosRHAtivosAppCount,
        // Outras divergências podem ser adicionadas aqui
      },
      riscos: {
        prejuizoPotencial: `R$ ${prejuizoCalculado.toLocaleString('pt-BR')}`,
        valorMitigado: `R$ ${valorMitigado.toLocaleString('pt-BR')}`,
        indiceConformidade: parseFloat(indiceConformidade),
        // Adicionar lógica para riscos em contas privilegiadas se necessário
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