// node-api/src/services/divergences/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// --- FUNÇÕES AUXILIARES ---
const cleanText = (text) => text?.trim().toLowerCase();
const cleanCpf = (cpf) => cpf?.replace(/[^\d]/g, '');

/**
 * @route   POST /divergences/exceptions
 * @desc    Cria uma nova exceção para uma divergência específica de uma identidade
 * @access  Private
 */
const createDivergenceException = async (req, res) => {
  const { identityId, divergenceCode, justification, targetSystem } = req.body;
  const userId = req.user.id;

  if (!identityId || !divergenceCode || !justification) {
    return res.status(400).json({ message: "ID da identidade, código da divergência e justificativa são obrigatórios." });
  }

  try {
    const newException = await prisma.divergenceException.create({
      data: {
        identityId,
        divergenceCode,
        justification,
        userId,
        targetSystem,
      },
    });
    res.status(201).json(newException);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "Já existe uma exceção para esta divergência nesta identidade." });
    }
    console.error("Erro ao criar exceção de divergência:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   POST /divergences/exceptions/bulk
 * @desc    Cria múltiplas exceções de uma vez (em massa)
 * @access  Private
 */
const createBulkDivergenceExceptions = async (req, res) => {
  const { identityIds, divergenceCode, justification, targetSystem } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(identityIds) || identityIds.length === 0 || !divergenceCode || !justification) {
    return res.status(400).json({ message: "Lista de IDs, código da divergência e justificativa são obrigatórios." });
  }

  try {
    const dataToCreate = identityIds.map(id => ({
      identityId: id,
      divergenceCode,
      justification,
      userId,
      targetSystem,
    }));

    const result = await prisma.divergenceException.createMany({
      data: dataToCreate,
      skipDuplicates: true,
    });

    res.status(201).json({ message: `${result.count} exceções foram criadas com sucesso.` });
  } catch (error) {
    console.error("Erro ao criar exceções de divergência em massa:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   GET /divergences/exceptions
 * @desc    Busca todas as exceções de divergência com dados relacionados
 * @access  Private
 */
const getExceptions = async (req, res) => {
  try {
    const exceptions = await prisma.divergenceException.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        identity: { 
          select: { 
            name: true, 
            email: true, 
            sourceSystem: true,
            profile: { select: { name: true }} 
          } 
        }, 
      },
    });
    res.status(200).json(exceptions);
  } catch (error) {
    console.error("Erro ao buscar exceções:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   DELETE /divergences/exceptions/:id
 * @desc    Deleta uma exceção de divergência (reativa o risco)
 * @access  Private
 */
const deleteException = async (req, res) => {
  const exceptionId = parseInt(req.params.id, 10);
  if (isNaN(exceptionId)) {
    return res.status(400).json({ message: "ID de exceção inválido." });
  }
  try {
    await prisma.divergenceException.delete({ where: { id: exceptionId } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Exceção não encontrada." });
    }
    console.error("Erro ao deletar exceção:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   POST /divergences/exceptions/bulk-delete
 * @desc    Deleta múltiplas exceções de uma vez (em massa)
 * @access  Private
 */
const deleteBulkExceptions = async (req, res) => {
  const { exceptionIds } = req.body;

  if (!Array.isArray(exceptionIds) || exceptionIds.length === 0) {
    return res.status(400).json({ message: "A lista de IDs de exceção é obrigatória." });
  }

  try {
    const result = await prisma.divergenceException.deleteMany({
      where: {
        id: {
          in: exceptionIds,
        },
      },
    });

    res.status(200).json({ message: `${result.count} exceções foram removidas com sucesso.` });
  } catch (error) {
    console.error("Erro ao deletar exceções em massa:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   GET /divergences/by-code/:code
 * @desc    Busca todas as identidades que possuem um tipo de divergência específico.
 * @access  Private
 */
const getDivergencesByCode = async (req, res) => {
  const { code } = req.params;
  const { system } = req.query;

  try {
    let divergenceData = [];
    
    const rhIdentities = await prisma.identity.findMany({ where: { sourceSystem: 'RH' } });
    const rhMap = new Map(rhIdentities.map(i => [i.identityId, i]));

    // Define o appWhere (filtro para sistemas) aqui para ser reutilizado
    const appWhere = { sourceSystem: { not: 'RH' } };
    if (system && system.toLowerCase() !== 'geral') {
      appWhere.sourceSystem = { equals: system, mode: 'insensitive' };
    }
    
    switch (code) {
      case 'ZOMBIE_ACCOUNT':
      case 'ORPHAN_ACCOUNT':
      case 'CPF_MISMATCH':
      case 'NAME_MISMATCH':
      case 'EMAIL_MISMATCH':
      case 'DORMANT_ADMIN': {
        const exceptions = await prisma.divergenceException.findMany({
          where: { divergenceCode: code, userId: req.user.id, targetSystem: null }
        });
        const exceptedIdentityIds = new Set(exceptions.map(ex => ex.identityId));

        // Busca identidades de App (já filtradas, se 'system' foi passado)
        const appIdentities = await prisma.identity.findMany({ where: appWhere, include: { profile: true } });

        const allDivergences = appIdentities.filter(appUser => {
          if (exceptedIdentityIds.has(appUser.id)) return false;
          
          const rhUser = rhMap.get(appUser.identityId);
          if (code === 'ZOMBIE_ACCOUNT') return rhUser && appUser.status === 'Ativo' && rhUser.status === 'Inativo';
          if (code === 'ORPHAN_ACCOUNT') return !rhUser;
          if (code === 'CPF_MISMATCH') return rhUser && appUser.cpf && rhUser.cpf && cleanCpf(appUser.cpf) !== cleanCpf(rhUser.cpf);
          if (code === 'NAME_MISMATCH') return rhUser && appUser.name && rhUser.name && cleanText(appUser.name) !== cleanText(rhUser.name);
          if (code === 'EMAIL_MISMATCH') return rhUser && appUser.email && rhUser.email && cleanText(appUser.email) !== cleanText(rhUser.email);
          if (code === 'DORMANT_ADMIN') {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            if (appUser.profile?.name !== 'Admin' || appUser.status !== 'Ativo') return false;
            // Ajuste para verificar extraData.last_login
            const loginDateStr = typeof appUser.extraData === 'object' && appUser.extraData !== null ? appUser.extraData.last_login : null;
            if (!loginDateStr) return false; 
            const loginDate = new Date(loginDateStr);
            return !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
          }
          return false;
        });
        divergenceData = allDivergences.map(id => ({
          ...id,
          profile: id.profile?.name // Achata o perfil para a tabela
        }));
        break;
      }
      
      case 'ACCESS_NOT_GRANTED': {
        const activeRhUsers = rhIdentities.filter(rhUser => rhUser.status === 'Ativo');
        const results = [];

        const exceptions = await prisma.divergenceException.findMany({
            where: { divergenceCode: code, userId: req.user.id }
        });
        const exceptionsSet = new Set(exceptions.map(ex => `${ex.identityId}_${ex.targetSystem}`));

        // Busca todas as identidades de App (já filtradas, se 'system' foi passado)
        const appIdentities = await prisma.identity.findMany({ where: appWhere });
        
        // ======================= INÍCIO DA ALTERAÇÃO =======================
        // CORREÇÃO: Em vez de buscar na tabela 'System', buscamos os nomes
        // dos sistemas que *realmente têm dados* na tabela 'Identity'.
        const processedSystems = await prisma.identity.groupBy({
          by: ['sourceSystem'],
          where: appWhere, // Usa o mesmo filtro (não 'RH' e opcionalmente filtrado por 'system')
        });
        const systemNames = processedSystems.map(s => s.sourceSystem);
        // ======================== FIM DA ALTERAÇÃO =========================

        const identitiesBySystem = appIdentities.reduce((acc, identity) => {
          const systemKey = identity.sourceSystem;
          if (!acc[systemKey]) acc[systemKey] = new Set();
          acc[systemKey].add(identity.identityId);
          return acc;
        }, {});

        // Itera SOMENTE sobre os sistemas que têm dados processados
        (system && system.toLowerCase() !== 'geral' ? [system] : systemNames).forEach(systemName => {
            const systemIdSet = identitiesBySystem[systemName] || new Set();
            const missingInThisSystem = activeRhUsers.filter(rhUser => {
                return !systemIdSet.has(rhUser.identityId) && !exceptionsSet.has(`${rhUser.id}_${systemName}`);
            });
            
            missingInThisSystem.forEach(rhUser => {
                results.push({ 
                  ...rhUser, 
                  id: `${rhUser.id}-${systemName}`, // ID único composto
                  sourceSystem: systemName, // Sistema onde o acesso está faltando
                  profile: rhUser.profile?.name // Achata o perfil
                });
            });
        });
        
        divergenceData = results;
        break;
      }
      
      default:
        return res.status(400).json({ message: `Código de divergência '${code}' desconhecido.` });
    }

    return res.status(200).json(divergenceData);
  } catch (error) {
    console.error(`Erro ao buscar detalhes da divergência '${code}':`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   GET /divergences/exceptions/:id
 * @desc    Busca os detalhes completos de uma única exceção para exibição no modal.
 * @access  Private
 */
const getExceptionDetails = async (req, res) => {
  const exceptionId = parseInt(req.params.id, 10);
  if (isNaN(exceptionId)) {
    return res.status(400).json({ message: "ID de exceção inválido." });
  }

  try {
    const exception = await prisma.divergenceException.findUnique({
      where: { id: exceptionId },
      include: {
        user: { select: { name: true } },
        identity: {
          include: {
            profile: { 
              select: { name: true } 
            }
          }
        },
      },
    });

    if (!exception) {
      return res.status(404).json({ message: "Exceção não encontrada." });
    }

    const divergenceDetails = {};
    const identity = exception.identity;

    switch (exception.divergenceCode) {
      case 'CPF_MISMATCH':
      case 'NAME_MISMATCH':
      case 'EMAIL_MISMATCH':
      case 'ZOMBIE_ACCOUNT': {
        const rhUser = await prisma.identity.findFirst({
          where: {
            identityId: identity.identityId,
            sourceSystem: 'RH',
          },
        });
        divergenceDetails.rhData = rhUser || null;
        divergenceDetails.appData = identity;
        break;
      }
      
      case 'ACCESS_NOT_GRANTED': {
        divergenceDetails.rhData = identity;
        divergenceDetails.targetSystem = exception.targetSystem;
        break;
      }

      default:
        divergenceDetails.appData = identity;
        break;
    }

    res.status(200).json({ ...exception, divergenceDetails });

  } catch (error) {
    console.error(`Erro ao buscar detalhes da exceção ${exceptionId}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// --- Definição das Rotas ---
router.post("/exceptions", passport.authenticate("jwt", { session: false }), createDivergenceException);
router.post("/exceptions/bulk", passport.authenticate("jwt", { session: false }), createBulkDivergenceExceptions);
router.post("/exceptions/bulk-delete", passport.authenticate("jwt", { session: false }), deleteBulkExceptions);
router.get("/exceptions", passport.authenticate("jwt", { session: false }), getExceptions);
router.get("/exceptions/:id", passport.authenticate("jwt", { session: false }), getExceptionDetails);
router.delete("/exceptions/:id", passport.authenticate("jwt", { session: false }), deleteException);
router.get("/by-code/:code", passport.authenticate("jwt", { session: false }), getDivergencesByCode);

export default router;