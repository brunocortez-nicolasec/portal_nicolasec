// node-api/src/services/divergences/index.js

import express from "express";
import passport from "passport";
// Adicionado Prisma para tratamento de erro
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// --- FUNÇÕES AUXILIARES ---
const cleanText = (text) => text?.trim().toLowerCase();
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

const formatAccountProfiles = (account) => {
  if (!account) return null;
  const formattedAccount = { ...account };
  if (Array.isArray(formattedAccount.profiles)) {
    formattedAccount.profiles = formattedAccount.profiles
      .map(p => p.profile?.name)
      .filter(Boolean);
  } else {
    formattedAccount.profiles = [];
  }
  return formattedAccount;
};

/*
 * FUNÇÕES createDivergenceException, createBulkDivergenceExceptions,
 * getExceptions, deleteException, deleteBulkExceptions...
 * ...
 * (Sem alterações, omitidas para brevidade)
 */
const createDivergenceException = async (req, res) => {
  const { identityId, accountId, divergenceCode, justification, targetSystem } = req.body;
  
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ message: "ID de usuário inválido." });
  }

  if (!divergenceCode || !justification) {
      return res.status(400).json({ message: "Código da divergência e justificativa são obrigatórios." });
  }

  try {
    let newException;

    if (divergenceCode === 'ACCESS_NOT_GRANTED') {
      const identityIdInt = parseInt(identityId, 10);
      if (isNaN(identityIdInt) || !targetSystem) {
          return res.status(400).json({ message: "Para ACCESS_NOT_GRANTED, identityId e targetSystem são obrigatórios." });
      }
      
      newException = await prisma.identityDivergenceException.create({
        data: {
          identityId: identityIdInt,
          divergenceCode,
          justification,
          userId: userIdInt,
          targetSystem: targetSystem,
        },
      });

    } else {
      const accountIdInt = parseInt(accountId, 10);
      if (isNaN(accountIdInt)) {
          return res.status(400).json({ message: "Para este tipo de divergência, accountId é obrigatório." });
      }

      newException = await prisma.accountDivergenceException.create({
        data: {
          accountId: accountIdInt,
          divergenceCode,
          justification,
          userId: userIdInt,
        },
      });
    }

    res.status(201).json(newException);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { 
        return res.status(409).json({ message: "Já existe uma exceção deste tipo para este item." });
      }
      if (error.code === 'P2003') { 
         return res.status(404).json({ message: "Identidade ou Conta não encontrada para associar a exceção." });
      }
    }
    console.error("Erro ao criar exceção de divergência:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const createBulkDivergenceExceptions = async (req, res) => {
  const { identityIds, accountIds, divergenceCode, justification, targetSystem } = req.body;
  const userIdInt = parseInt(req.user.id, 10);
   if (isNaN(userIdInt)) return res.status(400).json({ message: "ID de usuário inválido." });

  if (!divergenceCode || !justification) {
    return res.status(400).json({ message: "Código da divergência e justificativa são obrigatórios." });
  }

  try {
    let count = 0;
    
    if (divergenceCode === 'ACCESS_NOT_GRANTED' && Array.isArray(identityIds) && identityIds.length > 0) {
        if (!targetSystem) {
             return res.status(400).json({ message: "targetSystem é obrigatório para exceções ACCESS_NOT_GRANTED." });
        }
        const dataToCreate = identityIds
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id))
            .map(identityIdInt => ({
                identityId: identityIdInt,
                divergenceCode,
                justification,
                userId: userIdInt,
                targetSystem: targetSystem,
        }));
        
        if(dataToCreate.length === 0) return res.status(400).json({ message: "Nenhum ID de identidade válido fornecido." });

        const result = await prisma.identityDivergenceException.createMany({
          data: dataToCreate,
          skipDuplicates: true,
        });
        count = result.count;
        
    } 
    else if (divergenceCode !== 'ACCESS_NOT_GRANTED' && Array.isArray(accountIds) && accountIds.length > 0) {
         const dataToCreate = accountIds
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id))
            .map(accountIdInt => ({
                accountId: accountIdInt,
                divergenceCode,
                justification,
                userId: userIdInt,
        }));
        
        if(dataToCreate.length === 0) return res.status(400).json({ message: "Nenhum ID de conta válido fornecido." });

        const result = await prisma.accountDivergenceException.createMany({
          data: dataToCreate,
          skipDuplicates: true,
        });
        count = result.count;
    } else {
        return res.status(400).json({ message: "Tipo de divergência e lista de IDs (identityIds ou accountIds) incompatíveis ou ausentes." });
    }

    res.status(201).json({ message: `${count} exceções foram criadas com sucesso.` });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
         return res.status(404).json({ message: "Uma ou mais identidades/contas não foram encontradas." });
    }
    console.error("Erro ao criar exceções de divergência em massa:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const getExceptions = async (req, res) => {
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }

  try {
    const identityExceptions = await prisma.identityDivergenceException.findMany({
      where: { userId: userIdInt },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        identity: { 
          select: { 
            id: true, name: true, email: true, cpf: true,
            sourceSystem: true, 
            identityId: true,
          } 
        },
      },
    });
    
    const accountExceptions = await prisma.accountDivergenceException.findMany({
        where: { userId: userIdInt },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true } },
            account: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpf: true,
                    accountIdInSystem: true,
                    system: { select: { name: true } }
                }
            }
        }
    });
    
    const formattedIdentityExceptions = identityExceptions.map(ex => ({
        id: ex.id,
        type: 'Identity',
        divergenceCode: ex.divergenceCode,
        justification: ex.justification,
        createdAt: ex.createdAt,
        expiresAt: ex.expiresAt,
        targetSystem: ex.targetSystem,
        user: ex.user,
        identity: ex.identity,
        account: null,
    }));
    
     const formattedAccountExceptions = accountExceptions.map(ex => ({
        id: ex.id,
        type: 'Account',
        divergenceCode: ex.divergenceCode,
        justification: ex.justification,
        createdAt: ex.createdAt,
        expiresAt: ex.expiresAt,
        targetSystem: ex.account?.system?.name || null,
        user: ex.user,
        identity: null, 
        account: ex.account,
    }));

    const allExceptions = [...formattedIdentityExceptions, ...formattedAccountExceptions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allExceptions);
  } catch (error) {
    console.error("Erro ao buscar exceções:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const deleteException = async (req, res) => {
  const exceptionId = parseInt(req.params.id, 10);
  const { type } = req.query;

  if (isNaN(exceptionId)) {
    return res.status(400).json({ message: "ID de exceção inválido." });
  }
  if (type !== 'Identity' && type !== 'Account') {
      return res.status(400).json({ message: "Parâmetro 'type' (Identity ou Account) é obrigatório na query." });
  }

  try {
    let deleteResult = { count: 0 };
    
    if (type === 'Identity') {
        deleteResult = await prisma.identityDivergenceException.deleteMany({
             where: { id: exceptionId } 
        });
    } else if (type === 'Account') {
         deleteResult = await prisma.accountDivergenceException.deleteMany({
             where: { id: exceptionId }
        });
    }

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Exceção não encontrada." });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar exceção:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const deleteBulkExceptions = async (req, res) => {
  const { exceptionIds, type } = req.body;

  if (!Array.isArray(exceptionIds) || exceptionIds.length === 0) {
    return res.status(400).json({ message: "A lista de IDs de exceção é obrigatória." });
  }
  if (type !== 'Identity' && type !== 'Account') {
      return res.status(400).json({ message: "O campo 'type' (Identity ou Account) é obrigatório." });
  }
  
  const validIds = exceptionIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  if(validIds.length === 0) {
     return res.status(400).json({ message: "Nenhum ID válido fornecido." });
  }

  try {
    let result = { count: 0 };
    
    if (type === 'Identity') {
        result = await prisma.identityDivergenceException.deleteMany({
            where: { id: { in: validIds } }
        });
    } else if (type === 'Account') {
         result = await prisma.accountDivergenceException.deleteMany({
            where: { id: { in: validIds } }
        });
    }

    res.status(200).json({ message: `${result.count} exceções do tipo '${type}' foram removidas com sucesso.` });
  } catch (error) {
    console.error("Erro ao deletar exceções em massa:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   GET /divergences/by-code/:code
 * @desc    Busca todas as identidades/contas que possuem um tipo de divergência específico.
 * @access  Private
 */
const getDivergencesByCode = async (req, res) => {
  const { code } = req.params;
  const { system } = req.query;
  const isGeneral = !system || system.toLowerCase() === 'geral';

  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }

  try {
    let divergenceData = [];
    
    const rhIdentities = await prisma.identity.findMany({ 
      where: { sourceSystem: 'RH' },
    });
    const rhMapByCpf = new Map(rhIdentities.filter(i => i.cpf).map(i => [cleanCpf(i.cpf), i]));
    const rhMapByEmail = new Map(rhIdentities.filter(i => i.email).map(i => [cleanText(i.email), i]));

    const accountsWhere = {};
    let targetSystemRecord = null;
    if (system && !isGeneral && system.toUpperCase() !== 'RH') {
        targetSystemRecord = await prisma.system.findUnique({ where: { name: system }, select: { id: true, name: true }});
        if (!targetSystemRecord) {
            return res.status(404).json({ message: `Sistema "${system}" não encontrado.`});
        }
        accountsWhere.systemId = targetSystemRecord.id;
    }
    
    const identityExceptions = await prisma.identityDivergenceException.findMany({
        where: { divergenceCode: code, userId: userIdInt }
    });
    const accountExceptions = await prisma.accountDivergenceException.findMany({
         where: { divergenceCode: code, userId: userIdInt }
    });
    
    const identityExceptionsSet = new Set(identityExceptions.map(ex => `${ex.identityId}_${ex.divergenceCode}_${ex.targetSystem || 'null'}`));
    const accountExceptionsSet = new Set(accountExceptions.map(ex => `${ex.accountId}_${ex.divergenceCode}`));


    // 4. Lógica de busca baseada no código
    switch (code) {
      case 'ZOMBIE_ACCOUNT':
      case 'ORPHAN_ACCOUNT':
      case 'CPF_MISMATCH':
      case 'NAME_MISMATCH':
      case 'EMAIL_MISMATCH':
      case 'USERTYPE_MISMATCH':
      case 'DORMANT_ADMIN': {
        
        const appAccounts = await prisma.account.findMany({ 
            where: accountsWhere, 
            include: { 
                profiles: { include: { profile: true } },
                system: { select: { name: true } }
            } 
        });

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const allDivergences = appAccounts.filter(account => {
            if (accountExceptionsSet.has(`${account.id}_${code}`)) return false;

            const rhUser = (account.cpf && rhMapByCpf.get(cleanCpf(account.cpf))) ||
                           (account.email && rhMapByEmail.get(cleanText(account.email)));
            
            if (code === 'ZOMBIE_ACCOUNT') return rhUser && account.status === 'Ativo' && rhUser.status === 'Inativo';
            if (code === 'ORPHAN_ACCOUNT') return !rhUser;
            if (code === 'CPF_MISMATCH') return rhUser && account.cpf && rhUser.cpf && cleanCpf(account.cpf) !== cleanCpf(rhUser.cpf);
            if (code === 'NAME_MISMATCH') return rhUser && account.name && rhUser.name && cleanText(account.name) !== cleanText(rhUser.name);
            if (code === 'EMAIL_MISMATCH') return rhUser && account.email && rhUser.email && cleanText(account.email) !== cleanText(rhUser.email);
            if (code === 'USERTYPE_MISMATCH') return rhUser && account.userType && rhUser.userType && cleanText(account.userType) !== cleanText(rhUser.userType);
            
            if (code === 'DORMANT_ADMIN') {
              const isAdmin = account.profiles.some(p => p.profile.name === 'Admin');
              if (!isAdmin || account.status !== 'Ativo') return false;
              
              const loginDateStr = typeof account.extraData === 'object' && account.extraData !== null ? account.extraData.last_login : null;
              if (!loginDateStr) return false; 
              const loginDate = new Date(loginDateStr);
              return !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
            }
            return false;
        });

        // Formata os dados
        divergenceData = allDivergences.map(account => {
             const rhUser = (account.cpf && rhMapByCpf.get(cleanCpf(account.cpf))) ||
                            (account.email && rhMapByEmail.get(cleanText(account.email)));
             return {
                ...account,
                profile: account.profiles.map(p => p.profile.name).join(', ') || 'N/A',
                sourceSystem: account.system.name,
                rhData: rhUser || null,
                appData: account
             };
        });
        break;
      }
      
      case 'ACCESS_NOT_GRANTED': {
        const activeRhUsers = rhIdentities.filter(rhUser => rhUser.status === 'Ativo');
        const results = [];

        const targetSystems = isGeneral 
            ? await prisma.system.findMany({ where: { name: { not: 'RH' } }, select: { id: true, name: true } })
            : (targetSystemRecord ? [targetSystemRecord] : []);
        
        const allAccounts = await prisma.account.findMany({
            where: { identityId: { not: null } },
            select: { identityId: true, systemId: true }
        });
        
        const accountsByIdentity = allAccounts.reduce((acc, account) => {
            if (!acc[account.identityId]) acc[account.identityId] = new Set();
            acc[account.identityId].add(account.systemId);
            return acc;
        }, {});
        
        for (const system of targetSystems) {
            activeRhUsers.forEach(rhUser => {
                const hasAccountInSystem = accountsByIdentity[rhUser.id]?.has(system.id);
                const isExcepted = identityExceptionsSet.has(`${rhUser.id}_${code}_${system.name}`);

                if (!hasAccountInSystem && !isExcepted) {
                    results.push({
                        ...rhUser,
                        id: `${rhUser.id}-${system.name}`,
                        sourceSystem: system.name,
                        profile: null,
                    });
                }
            });
        }
        
        divergenceData = results;
        break;
      }
      
      // --- INÍCIO DA CORREÇÃO (SOD_VIOLATION - Etapa 3) ---
      case 'SOD_VIOLATION': {
        // 1. Buscar Regras de SOD (TODOS OS TIPOS)
        const sodWhere = {}; // <<< Começa vazio

        if (isGeneral) {
            // "Geral" - sem filtro de sistema
        } else if (targetSystemRecord) {
            // "Específico"
            // --- CORREÇÃO AQUI: Sintaxe do Prisma para OR ---
            sodWhere.OR = [
                { systemId: targetSystemRecord.id },
                { systemId: null }
            ];
            // --- FIM DA CORREÇÃO ---
        }
        
        // --- CORREÇÃO AQUI: Checa se 'system' (query param) existe antes de usar toUpperCase() ---
        const activeSodRules = (!system || system.toUpperCase() !== 'RH')
            ? await prisma.sodRule.findMany({
                where: sodWhere, // <<< QUERY CORRIGIDA
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

        if (activeSodRules.length === 0) {
          divergenceData = [];
          break;
        }

        // Agrupa regras por systemId para performance
        const rulesBySystemId = activeSodRules.reduce((acc, rule) => {
            const key = rule.systemId;
            if (!acc[key]) acc[key] = [];
            acc[key].push(rule);
            return acc;
        }, {});
        const globalRules = rulesBySystemId[null] || [];

        // 2. Buscar Contas (accountsWhere já filtra por sistema)
        const appAccounts = await prisma.account.findMany({ 
            where: accountsWhere, 
            include: { 
                profiles: { include: { profile: true } },
                system: { select: { name: true } },
                identity: { 
                    select: { userType: true, cpf: true, name: true, email: true, status: true }
                }
            } 
        });

        // 3. Filtrar contas que violam as regras
        const allDivergences = appAccounts.filter(account => {
            if (accountExceptionsSet.has(`${account.id}_${code}`)) {
              return false;
            }

            const systemSpecificRules = rulesBySystemId[account.systemId] || [];
            const applicableSodRules = [...systemSpecificRules, ...globalRules];

            if (applicableSodRules.length === 0) return false;

            const accountProfileIds = new Set(account.profiles.map(p => p.profile.id));
            
            const rhUser = account.identity;

            // Verifica violação
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
                    if (!rhUser) continue; 

                    const attributeName = rule.valueAId;
                    const attributeOperator = rule.valueAOperator;
                    const ruleValue = rule.valueAValue;
                    const conflictingProfileId = parseInt(rule.valueBId, 10);
                    
                    if (isNaN(conflictingProfileId) || !attributeName || !ruleValue) continue;

                    const userValue = rhUser[attributeName];
                    
                    const attributeMatch = checkAttributeMatch(attributeOperator, userValue, ruleValue);
                    
                    if (attributeMatch && accountProfileIds.has(conflictingProfileId)) {
                        violationFound = true;
                    }
                }

                if (violationFound) {
                  return true;
                }
            }
            
            return false;
        });

        // 4. Formatar os dados para o modal
        divergenceData = allDivergences.map(account => {
             return {
                ...account,
                profile: account.profiles.map(p => p.profile.name).join(', ') || 'N/A',
                sourceSystem: account.system.name,
                rhData: account.identity || null,
                appData: account
             };
        });
        
        break;
      }
      // --- FIM DA CORREÇÃO (SOD_VIOLATION) ---
      
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
 * (Função getExceptionDetails... sem alterações)
 */
const getExceptionDetails = async (req, res) => {
  const exceptionId = parseInt(req.params.id, 10);
  const { type } = req.query;

  if (isNaN(exceptionId)) {
    return res.status(400).json({ message: "ID de exceção inválido." });
  }
  if (type !== 'Identity' && type !== 'Account') {
      return res.status(400).json({ message: "Parâmetro 'type' (Identity ou Account) é obrigatório na query." });
  }

  try {
    let exception = null;
    const divergenceDetails = {};

    if (type === 'Identity') {
        exception = await prisma.identityDivergenceException.findUnique({
            where: { id: exceptionId },
            include: {
                user: { select: { name: true } },
                identity: {
                    select: { id: true, name: true, email: true, cpf: true, status: true, userType: true, identityId: true }
                },
            },
        });
        
        if (exception) {
            divergenceDetails.rhData = exception.identity;
            divergenceDetails.targetSystem = exception.targetSystem;
            divergenceDetails.appData = null;
        }

    } else if (type === 'Account') {
         exception = await prisma.accountDivergenceException.findUnique({
             where: { id: exceptionId },
             include: {
                 user: { select: { name: true } },
                 account: {
                     include: {
                         identity: {
                             select: { id: true, name: true, email: true, cpf: true, status: true, userType: true, identityId: true }
                         },
                         system: { select: { name: true } },
                         profiles: { include: { profile: { select: { name: true } } } }
                     }
                 }
             }
         });
         
         if (exception) {
             divergenceDetails.appData = formatAccountProfiles(exception.account);
             divergenceDetails.rhData = exception.account?.identity || null;
         }
    }

    if (!exception) {
      return res.status(404).json({ message: "Exceção não encontrada." });
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