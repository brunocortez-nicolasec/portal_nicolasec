// node-api/src/services/divergences/index.js

import express from "express";
import passport from "passport";
// Importar 'Prisma' para checagem de erros
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


/*
 * FUNÇÕES createDivergenceException, createBulkDivergenceExceptions,
 * (Estas funções vão falhar até o schema ser atualizado, o que é esperado)
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

    // INÍCIO DA LÓGICA DE EXCEÇÃO (VAI FALHAR ATÉ O SCHEMA SER ATUALIZADO)
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
    // FIM DA LÓGICA DE EXCEÇÃO

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
    // Erro esperado se os modelos não existirem:
    if (error.code === 'P2025' || error instanceof TypeError) {
      return res.status(500).json({ message: "Erro: As tabelas de Exceção (DivergenceException) não existem no banco de dados. O Schema precisa ser atualizado." });
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
    
    // INÍCIO DA LÓGICA DE EXCEÇÃO (VAI FALHAR ATÉ O SCHEMA SER ATUALIZADO)
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
    // FIM DA LÓGICA DE EXCEÇÃO

    res.status(201).json({ message: `${count} exceções foram criadas com sucesso.` });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
         return res.status(404).json({ message: "Uma ou mais identidades/contas não foram encontradas." });
    }
    if (error.code === 'P2025' || error instanceof TypeError) {
      return res.status(500).json({ message: "Erro: As tabelas de Exceção (DivergenceException) não existem no banco de dados. O Schema precisa ser atualizado." });
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
    let identityExceptions = [];
    let accountExceptions = [];

    // Tenta buscar, mas se falhar (porque as tabelas não existem), apenas retorna arrays vazios.
    try {
        identityExceptions = await prisma.identityDivergenceException.findMany({
            where: { userId: userIdInt },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } },
                identity: {
                    select: { 
                        id: true, 
                        name_hr: true, 
                        email_hr: true, 
                        cpf_hr: true,
                        identity_id_hr: true,
                    } 
                },
            },
        });
        
        accountExceptions = await prisma.accountDivergenceException.findMany({
            where: { userId: userIdInt },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } },
                account: { 
                    select: {
                        id: true,
                        name_account: true,
                        email_account: true,
                        id_in_system_account: true,
                        system: { select: { name_system: true } }
                    }
                }
            }
        });
    } catch (e) {
        // Ignora o erro se for TypeError (tabelas não existem)
        if (!(e instanceof TypeError)) {
            throw e; // Lança outros erros
        }
        console.warn("Aviso: Tabelas de Exceção não encontradas. A funcionalidade 'Ignorar' está desabilitada.");
    }
    
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
        targetSystem: ex.account?.system?.name_system || null,
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
    if (error.code === 'P2025' || error instanceof TypeError) {
      return res.status(500).json({ message: "Erro: As tabelas de Exceção (DivergenceException) não existem no banco de dados." });
    }
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
    if (error.code === 'P2025' || error instanceof TypeError) {
      return res.status(500).json({ message: "Erro: As tabelas de Exceção (DivergenceException) não existem no banco de dados." });
    }
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
    
    const rhIdentities = await prisma.identitiesHR.findMany({ 
        where: { 
            dataSource: { 
                userId: userIdInt,
                origem_datasource: 'RH'
            }
        },
    });

    const accountsWhere = {
        system: {
            dataSourcesConfigs: { some: { dataSource: { userId: userIdInt } } }
        }
    };
    let targetSystemRecord = null;
    if (system && !isGeneral && system.toUpperCase() !== 'RH') {
        targetSystemRecord = await prisma.system.findUnique({ 
            where: { name_system: system }, 
            select: { id: true, name_system: true }
        });
        if (!targetSystemRecord) {
            return res.status(404).json({ message: `Sistema "${system}" não encontrado.`});
        }
        accountsWhere.systemId = targetSystemRecord.id;
    }
    
    let identityExceptionsSet = new Set();
    let accountExceptionsSet = new Set();

    try {
        const identityExceptions = await prisma.identityDivergenceException.findMany({
            where: { divergenceCode: code, userId: userIdInt }
        });
        const accountExceptions = await prisma.accountDivergenceException.findMany({
            where: { divergenceCode: code, userId: userIdInt }
        });
        
        identityExceptionsSet = new Set(identityExceptions.map(ex => `${ex.identityId}_${ex.divergenceCode}_${ex.targetSystem || 'null'}`));
        accountExceptionsSet = new Set(accountExceptions.map(ex => `${ex.accountId}_${ex.divergenceCode}`));
    
    } catch (e) {
        if (!(e instanceof TypeError)) {
            throw e; 
        }
        console.warn(`Aviso: Tabelas de Exceção não encontradas. A busca por '${code}' não filtrará exceções.`);
    }

    // 4.5. Buscar Regras de SoD (APENAS se o código for SOD_VIOLATION)
    let allSodRules = [];
    let sodRulesBySystem = {};
    let globalSodRules = [];

    if (code === 'SOD_VIOLATION') {
        allSodRules = await prisma.sodRule.findMany({
            where: { userId: userIdInt }
        });

        sodRulesBySystem = allSodRules.reduce((acc, rule) => {
            const key = rule.systemId || 'global'; 
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(rule);
            return acc;
        }, {});
        globalSodRules = sodRulesBySystem['global'] || [];
    }

    // 5. Lógica de busca baseada no código
    switch (code) {
      case 'ZOMBIE_ACCOUNT':
      case 'ORPHAN_ACCOUNT':
      case 'CPF_MISMATCH': 
      case 'NAME_MISMATCH':
      case 'EMAIL_MISMATCH':
      case 'USERTYPE_MISMATCH':
      case 'DORMANT_ADMIN': {
        
        const appAccounts = await prisma.accounts.findMany({ 
            where: accountsWhere, 
            include: { 
                identity: true, // <-- CORRIGIDO
                assignments: { include: { resource: true } }, 
                system: { select: { name_system: true } } 
            } 
        });

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const allDivergences = appAccounts.filter(account => {
            if (accountExceptionsSet.has(`${account.id}_${code}`)) return false;

            const rhUser = account.identity; 
            
            if (code === 'ZOMBIE_ACCOUNT') return rhUser && account.status_account === 'Ativo' && rhUser.status_hr === 'Inativo';
            if (code === 'ORPHAN_ACCOUNT') return !rhUser;
            
            if (code === 'CPF_MISMATCH') return rhUser && account.cpf_account && rhUser.cpf_hr && cleanCpf(account.cpf_account) !== cleanCpf(rhUser.cpf_hr);
            if (code === 'NAME_MISMATCH') return rhUser && account.name_account && rhUser.name_hr && cleanText(account.name_account) !== cleanText(rhUser.name_hr);
            if (code === 'EMAIL_MISMATCH') return rhUser && account.email_account && rhUser.email_hr && cleanText(account.email_account) !== cleanText(rhUser.email_hr);
            if (code === 'USERTYPE_MISMATCH') return rhUser && account.user_type_account && rhUser.user_type_hr && cleanText(account.user_type_account) !== cleanText(rhUser.user_type_hr);
            
            if (code === 'DORMANT_ADMIN') {
              const isAdmin = account.assignments.some(a => a.resource.name_resource.toLowerCase().includes('admin'));
              if (!isAdmin || account.status_account !== 'Ativo') return false;
              
              const loginDateStr = typeof account.extra_data_account === 'object' && account.extra_data_account !== null ? account.extra_data_account.last_login : null;
              if (!loginDateStr) return false; 
              const loginDate = new Date(loginDateStr);
              return !isNaN(loginDate.getTime()) && loginDate < ninetyDaysAgo;
            }
            return false;
        });

        // Formata os dados
        divergenceData = allDivergences.map(account => {
            const rhUser = account.identity;
            return {
                ...account,
                name: account.name_account, 
                email: account.email_account,
                status: account.status_account, 
                profile: account.assignments.map(a => a.resource.name_resource).join(', ') || 'N/A',
                sourceSystem: account.system.name_system,
                rhData: rhUser || null,
                appData: account
            };
        });
        break;
      }
      
      case 'ACCESS_NOT_GRANTED': {
        const activeRhUsers = rhIdentities.filter(rhUser => rhUser.status_hr === 'Ativo');
        const results = [];

        const targetSystems = isGeneral 
            ? await prisma.system.findMany({ where: { name_system: { not: 'RH' }, dataSourcesConfigs: { some: { dataSource: { userId: userIdInt } } } }, select: { id: true, name_system: true } })
            : (targetSystemRecord ? [targetSystemRecord] : []);
        
        const allAccounts = await prisma.accounts.findMany({
            where: { 
                identityId: { not: null },
                system: { dataSourcesConfigs: { some: { dataSource: { userId: userIdInt } } } }
            },
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
                const isExcepted = identityExceptionsSet.has(`${rhUser.id}_${code}_${system.name_system}`);

                if (!hasAccountInSystem && !isExcepted) {
                    results.push({
                        ...rhUser,
                        id: `${rhUser.id}-${system.name_system}`,
                        name: rhUser.name_hr, 
                        email: rhUser.email_hr, 
                        status: rhUser.status_hr, 
                        sourceSystem: system.name_system,
                        profile: null,
                    });
                }
            });
        }
        
        divergenceData = results;
        break;
      }
      
      case 'SOD_VIOLATION': {
        
        const appAccounts = await prisma.accounts.findMany({ 
            where: accountsWhere, 
            include: { 
                identity: true, // <-- CORRIGIDO
                assignments: { include: { resource: true } },
                system: { select: { name_system: true, id: true } }, 
            } 
        });

        const allDivergences = appAccounts.filter(account => {
            if (accountExceptionsSet.has(`${account.id}_${code}`)) {
              return false;
            }

            const systemSpecificRules = sodRulesBySystem[account.systemId] || [];
            const applicableSodRules = [...globalSodRules, ...systemSpecificRules];

            if (applicableSodRules.length === 0) return false;

            const accountResourceIds = new Set(account.assignments.map(a => a.resource.id)); 
            
            const rhUser = account.identity; // Agora é o objeto completo

            // Verifica violação
            for (const rule of applicableSodRules) {
                let violationFound = false;

                if (rule.ruleType === 'ROLE_X_ROLE') {
                    const ruleProfileId1 = parseInt(rule.valueAId, 10);
                    const ruleProfileId2 = parseInt(rule.valueBId, 10);
                    if (accountResourceIds.has(ruleProfileId1) && accountResourceIds.has(ruleProfileId2)) { 
                        violationFound = true;
                    }
                } 
                
                else if (rule.ruleType === 'ATTR_X_ROLE') {
                    if (!rhUser) continue; 

                    const attributeName = rule.valueAId;
                    const attributeOperator = rule.valueAOperator;
                    const ruleValue = rule.valueAValue;
                    const conflictingProfileId = parseInt(rule.valueBId, 10);
                    
                    const userValue = rhUser[attributeName]; // AGORA FUNCIONA PARA QUALQUER ATRIBUTO
                    
                    const attributeMatch = checkAttributeMatch(attributeOperator, userValue, ruleValue);
                    
                    if (attributeMatch && accountResourceIds.has(conflictingProfileId)) {
                        violationFound = true;
                    }
                }

                if (violationFound) {
                  return true;
                }
            }
            
            return false;
        });

        // Formatar os dados para o modal
        divergenceData = allDivergences.map(account => {
             return {
                ...account,
                name: account.name_account,
                email: account.email_account,
                status: account.status_account,
                profile: account.assignments.map(a => a.resource.name_resource).join(', ') || 'N/A',
                sourceSystem: account.system.name_system,
                rhData: account.identity || null,
                appData: account
             };
        });
        
        break;
      }
      
      default:
        return res.status(400).json({ message: `Código de divergência '${code}' desconhecido.` });
    }

    return res.status(200).json(divergenceData);
// ======================= INÍCIO DA CORREÇÃO (SyntaxError) =======================
  } catch (error) {
    if (error.code === 'P2025' || error instanceof TypeError) {
      return res.status(500).json({ message: "Erro de Tipo no servidor. Verifique os modelos de Exceção.", internalError: error.message });
    }
    console.error(`Erro ao buscar detalhes da divergência '${code}':`, error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};
// ======================== FIM DA CORREÇÃO (SyntaxError) =========================


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
                    select: { id: true, name_hr: true, email_hr: true, cpf_hr: true, status_hr: true, user_type_hr: true, identity_id_hr: true } 
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
                             select: { id: true, name_hr: true, email_hr: true, cpf_hr: true, status_hr: true, user_type_hr: true, identity_id_hr: true }
                         },
                         system: { select: { name_system: true } }, 
                         assignments: { include: { resource: { select: { name_resource: true } } } } 
                     }
                 }
             }
         });
         
         if (exception) {
            const formattedAccount = { ...exception.account };
            if (formattedAccount.assignments) {
                formattedAccount.profileNames = formattedAccount.assignments.map(a => a.resource.name_resource).join(', ');
            }
            
            divergenceDetails.appData = formattedAccount;
            divergenceDetails.rhData = exception.account?.identity || null;
         }
    }

    if (!exception) {
      return res.status(404).json({ message: "Exceção não encontrada." });
    }

    res.status(200).json({ ...exception, divergenceDetails });

  } catch (error) {
     if (error.code === 'P2025' || error instanceof TypeError) {
      return res.status(404).json({ message: "Exceção não encontrada (tabelas não existem)." });
    }
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