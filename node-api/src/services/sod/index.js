// node-api/src/services/sod-rules/index.js

import express from "express";
import passport from "passport";
// Importar 'Prisma' para checagem de erros
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// --- Constantes ---
const validComparisonOperators = [
  "equals", "not_equals", "contains", "starts_with", "ends_with"
];

// Mapeamento de Tipos de Regra para Tipos de Valor A e B
const typeMapping = {
  ROLE_X_ROLE:   { a: "PROFILE",   b: "PROFILE"   },
  ATTR_X_ROLE:   { a: "ATTRIBUTE", b: "PROFILE"   },
  ATTR_X_SYSTEM: { a: "ATTRIBUTE", b: "SYSTEM"    },
  // ATTR_X_ATTR (Se adicionado futuramente)
  // PROFILE_X_SYSTEM (Se adicionado futuramente)
};

/**
 * Helper para validar e extrair os dados dinâmicos do request body.
 * (Atualizado para validar systemId e perfis contra o sistema)
 */
// Agora é async para validar perfis no DB
const validateAndPrepareSodData = async (body, isUpdate = false) => {
  const {
    name, description, areaNegocio, processoNegocio, owner,
    systemId, // <<< VEM COMO 'null' PARA GLOBAL
    ruleTypeId,
    valueA,
    valueB,
    valueAOperator,
    valueAValue
  } = body;

  // 1. Validação básica (inclui systemId)
  if (!name || !ruleTypeId) {
    throw new Error("Nome da Regra e Tipo de Regra são obrigatórios.");
  }

  // --- INÍCIO DA CORREÇÃO ---
  let finalSystemId = null; // Default para null (Global)

  // Se systemId não for nulo, valida se é um número
  if (systemId !== null && systemId !== undefined) {
      const parsedId = parseInt(systemId, 10);
      if (isNaN(parsedId)) {
          throw new Error("ID do Sistema (systemId) é inválido. Deve ser um número ou nulo (para Global).");
      }
      finalSystemId = parsedId;
  }
  
  // Verifica se o sistema existe (APENAS se não for Global)
  if (finalSystemId !== null) {
      const systemExists = await prisma.system.findUnique({ where: { id: finalSystemId } });
      if (!systemExists) {
          throw new Error(`Sistema com ID ${finalSystemId} não encontrado.`);
      }
  }
  // --- FIM DA CORREÇÃO ---

  // 2. Extrai e valida valores dinâmicos
  const mapping = typeMapping[ruleTypeId];
  if (!mapping) {
    throw new Error("Tipo de regra inválido.");
  }
  if (!valueA || !valueB) {
    throw new Error("Valores de comparação A e B são obrigatórios.");
  }

  const valueAIdRaw = valueA?.id;
  const valueBIdRaw = valueB?.id;

  if (valueAIdRaw === null || valueAIdRaw === undefined || valueBIdRaw === null || valueBIdRaw === undefined) {
    throw new Error("IDs dos valores de comparação A ou B estão faltando.");
  }

  let valueAId = String(valueAIdRaw);
  let valueBId = String(valueBIdRaw);
  let finalValueAOperator = null;
  let finalValueAValue = null;

  // 3. Validações baseadas nos tipos
  // Validar Valor A
  if (mapping.a === "PROFILE") {
      // --- INÍCIO DA CORREÇÃO: Proíbe Perfil em Regra Global ---
      if (finalSystemId === null) {
        throw new Error("Não é permitido usar Perfil (PROFILE) como critério em uma regra Global.");
      }
      // --- FIM DA CORREÇÃO ---
      const profileA = await prisma.profile.findFirst({
          where: { id: parseInt(valueAId, 10), systemId: finalSystemId } // Usa finalSystemId
      });
      if (!profileA) {
          throw new Error(`Perfil A (ID: ${valueAId}) não encontrado ou não pertence ao Sistema (ID: ${finalSystemId}).`);
      }
      valueAId = String(profileA.id);
  }
  else if (mapping.a === "ATTRIBUTE") {
      if (!valueAOperator || !validComparisonOperators.includes(valueAOperator)) {
        throw new Error("Operador inválido ou ausente para o Atributo A.");
      }
      if (valueAValue === null || valueAValue === undefined || String(valueAValue).trim() === '') {
        throw new Error("Valor ausente ou inválido para o Atributo A.");
      }
      finalValueAOperator = valueAOperator;
      finalValueAValue = String(valueAValue);
  }

  // Validar Valor B
  if (mapping.b === "PROFILE") {
      // --- INÍCIO DA CORREÇÃO: Proíbe Perfil em Regra Global ---
      if (finalSystemId === null) {
        throw new Error("Não é permitido usar Perfil (PROFILE) como critério em uma regra Global.");
      }
      // --- FIM DA CORREÇÃO ---
      const profileB = await prisma.profile.findFirst({
          where: { id: parseInt(valueBId, 10), systemId: finalSystemId } // Usa finalSystemId
      });
      if (!profileB) {
          throw new Error(`Perfil B (ID: ${valueBId}) não encontrado ou não pertence ao Sistema (ID: ${finalSystemId}).`);
      }
      valueBId = String(profileB.id);
  }
  else if (mapping.b === "SYSTEM") {
      valueBId = String(valueBIdRaw);
  }
  
  // 4. Normalização
  if (mapping.a === mapping.b && valueAId === valueBId) {
    throw new Error("As seleções de comparação não podem ser iguais quando são do mesmo tipo.");
  }
  if (mapping.a === mapping.b && mapping.a !== "ATTRIBUTE") {
    if (valueAId.localeCompare(valueBId) > 0) {
        // Inverte A e B
        return {
          name, description, areaNegocio, processoNegocio, owner, systemId: finalSystemId, ruleType: ruleTypeId, // <<< CORRIGIDO
          valueAType: mapping.b, valueAId: valueBId,
          valueAOperator: null, valueAValue: null,
          valueBType: mapping.a, valueBId: valueAId,
        };
    }
  }

  // 5. Retorna dados validados
  return {
    name, description, areaNegocio, processoNegocio, owner, systemId: finalSystemId, ruleType: ruleTypeId, // <<< CORRIGIDO
    valueAType: mapping.a, valueAId: valueAId,
    valueAOperator: finalValueAOperator,
    valueAValue: finalValueAValue,
    valueBType: mapping.b, valueBId: valueBId,
  };
};

// Helper para buscar regra duplicada (agora usa a constraint única nomeada)
const findExistingRule = async (prismaArgs) => {
    // A constraint é @@unique([userId, systemId, valueAType, valueAId, valueAOperator, valueAValue, valueBType, valueBId], name: "UniqueSodRuleByUserSystem")
    // O schema foi alterado para remover a constraint unique, mas a lógica de verificação manual ainda é útil.
    return await prisma.sodRule.findFirst({
         where: {
             userId: prismaArgs.userId,
             systemId: prismaArgs.systemId, // <<< CORREÇÃO: Isso agora busca 'null' corretamente
             valueAType: prismaArgs.valueAType,
             valueAId: prismaArgs.valueAId,
             valueAOperator: prismaArgs.valueAOperator || null, // Garante null se undefined
             valueAValue: prismaArgs.valueAValue || null,       // Garante null se undefined
             valueBType: prismaArgs.valueBType,
             valueBId: prismaArgs.valueBId,
             id: prismaArgs.id // Usado para checagem de atualização (ex: id: { not: ruleId })
         }
       });
};


/**
 * @route    GET /sod-rules
 * @desc     Busca todas as regras de SOD (agora inclui info do sistema)
 * @access   Private
 * @query    ?systemId=<ID> (Opcional)
 */
const getSodRules = async (req, res) => {
 try {
    const userIdInt = parseInt(req.user.id, 10);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
    }

    const { systemId } = req.query;
    const whereClause = { userId: userIdInt };

    // Adiciona filtro por systemId se fornecido
    if (systemId) {
         const systemIdInt = parseInt(systemId, 10);
         if (!isNaN(systemIdInt)) {
             // --- INÍCIO DA CORREÇÃO: Permite buscar regras globais (null) E específicas ---
             whereClause.OR = [
                { systemId: systemIdInt },
                { systemId: null }
             ];
             // --- FIM DA CORREÇÃO ---
         } else {
              return res.status(400).json({ message: "systemId inválido." });
         }
     }
     // Se 'systemId' não for fornecido (Visão Geral), 'whereClause' só tem 'userId',
     // buscando todas as regras (globais e específicas), o que está correto.

    const rules = await prisma.sodRule.findMany({
       where: whereClause,
       select: { // Seleciona campos, incluindo o sistema
           id: true,
           name: true,
           description: true,
           areaNegocio: true,
           processoNegocio: true,
           owner: true,
           ruleType: true,
           valueAType: true,
           valueAId: true,
           valueAOperator: true,
           valueAValue: true,
           valueBType: true,
           valueBId: true,
           createdAt: true,
           updatedAt: true,
           userId: true,
           systemId: true, // <<< ADICIONADO para debug e lógica
           system: { // <<< INCLUÍDO
               select: {
                   id: true,
                   name: true
               }
           }
       },
       orderBy: { createdAt: "desc" },
    });
    res.status(200).json(rules);
 } catch (error) {
    console.error("Erro ao buscar regras de SOD:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
 }
};

/**
 * @route    POST /sod-rules
 * @desc     Cria uma nova regra de SOD (agora requer systemId)
 * @access   Private
 */
const createSodRule = async (req, res) => {
  // O body agora deve conter systemId (pode ser null)
  // valueA/valueB são objetos {id: ...}
  const { name, ruleTypeId } = req.body;

  if (!name || !ruleTypeId) {
    return res.status(400).json({ message: "Nome e Tipo de Regra são obrigatórios." });
  }

  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido para criação."});
  }

  try {
    // 1. Validar e preparar dados (agora é async e valida systemId/perfis)
    const validatedData = await validateAndPrepareSodData(req.body);

    // 2. Prepara argumentos para buscar duplicata
    const duplicateCheckArgs = {
        userId: userIdInt,
        systemId: validatedData.systemId, // <<< Agora pode ser null
        valueAType: validatedData.valueAType,
        valueAId: validatedData.valueAId,
        valueAOperator: validatedData.valueAOperator,
        valueAValue: validatedData.valueAValue,
        valueBType: validatedData.valueBType,
        valueBId: validatedData.valueBId,
    };

    const existingRule = await findExistingRule(duplicateCheckArgs);

    if (existingRule) {
      return res.status(409).json({ message: "Uma regra de conflito idêntica (mesmo sistema, valores e atributos) já existe." });
    }

    // 3. Cria a regra no banco (validatedData contém todos os campos)
    const newRule = await prisma.sodRule.create({
      data: {
        ...validatedData, // Contém name, desc, owner, systemId (Int? ou null), ruleType, values...
        userId: userIdInt, // Adiciona o userId
      },
    });

    res.status(201).json(newRule);
  } catch (error) {
    console.error("Erro ao criar regra de SOD:", error);
    const isValidationError = error.message.includes("obrigatório") ||
                              error.message.includes("inválido") ||
                              error.message.includes("Não é permitido") || // <<< Adicionado
                              error.message.includes("não encontrado ou não pertence");
    res.status(isValidationError ? 400 : 500)
       .json({ message: error.message || "Erro interno do servidor." });
  }
};

/**
 * @route    PATCH /sod-rules/:id
 * @desc     Atualiza uma regra de SOD
 * @access   Private
 */
const updateSodRule = async (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  const { name, ruleTypeId } = req.body; // Pega campos básicos para validação

  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }
  if (isNaN(ruleId)) {
      return res.status(400).json({ message: "ID de regra inválido." });
  }
  if (!name || !ruleTypeId) {
      return res.status(400).json({ message: "Nome e Tipo de Regra são obrigatórios." });
  }

  try {
    // 1. Validar e preparar dados (agora é async e valida systemId/perfis)
    const validatedData = await validateAndPrepareSodData(req.body, true);

    // 2. Verifica se a regra a ser atualizada existe e pertence ao usuário
    const rule = await prisma.sodRule.findFirst({
      where: { id: ruleId, userId: userIdInt },
      select: { systemId: true } // Pega o systemId existente
    });
    if (!rule) {
      return res.status(404).json({ message: "Regra não encontrada ou não pertence a este usuário." });
    }
    
    // 3. Segurança: Não permite alterar o sistema de uma regra
    // (A lógica de 'validateAndPrepareSodData' já garante que 'validatedData.systemId' é Int? ou null)
    if (validatedData.systemId !== rule.systemId) {
         throw new Error("Não é permitido alterar o Sistema de uma regra SoD existente.");
    }

    // 4. Prepara argumentos para buscar duplicata
    const duplicateCheckArgs = {
        userId: userIdInt,
        systemId: validatedData.systemId,
        valueAType: validatedData.valueAType,
        valueAId: validatedData.valueAId,
        valueAOperator: validatedData.valueAOperator,
        valueAValue: validatedData.valueAValue,
        valueBType: validatedData.valueBType,
        valueBId: validatedData.valueBId,
        id: { not: ruleId }, // Exclui a regra atual
    };

    const existingRule = await findExistingRule(duplicateCheckArgs);

    if (existingRule) {
      return res.status(409).json({ message: "Uma regra de conflito idêntica (mesmo sistema, valores e atributos) já existe." });
    }

    // 5. Atualiza a regra
    const updatedRule = await prisma.sodRule.update({
      where: { id: ruleId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        areaNegocio: validatedData.areaNegocio,
        processoNegocio: validatedData.processoNegocio,
        owner: validatedData.owner,
        ruleType: validatedData.ruleType,
        valueAType: validatedData.valueAType,
        valueAId: validatedData.valueAId,
        valueAOperator: validatedData.valueAOperator,
        valueAValue: validatedData.valueAValue,
        valueBType: validatedData.valueBType,
        valueBId: validatedData.valueBId,
        // systemId e userId não mudam
      },
    });

    res.status(200).json(updatedRule);
  } catch (error) {
    console.error("Erro ao atualizar regra de SOD:", error);
    const isValidationError = error.message.includes("obrigatório") ||
                              error.message.includes("inválido") ||
                              error.message.includes("não encontrado ou não pertence") ||
                              error.message.includes("Não é permitido"); // <<< Corrigido
    res.status(isValidationError ? 400 : 500)
       .json({ message: error.message || "Erro interno do servidor." });
  }
};

/**
 * @route    DELETE /sod-rules/:id
 * @desc     Deleta uma regra de SOD
 * @access   Private
 */
const deleteSodRule = async (req, res) => {
    const ruleId = parseInt(req.params.id, 10);
    const userIdInt = parseInt(req.user.id, 10);

    if (isNaN(ruleId)) {
        return res.status(400).json({ message: "ID de regra inválido." });
    }
    if (isNaN(userIdInt)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
    }

    try {
        const deleteResult = await prisma.sodRule.deleteMany({
            where: {
                id: ruleId,
                userId: userIdInt,
            },
        });

        if (deleteResult.count === 0) {
            return res.status(404).json({ message: "Regra não encontrada ou não pertence a este usuário." });
        }

        res.status(204).send();
    } catch (error) {
         console.error(`Erro ao deletar regra de SOD #${ruleId}:`, error);
         // Trata erro de constraint (P2003) - Pouco provável agora
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             return res.status(409).json({ message: "Não é possível excluir esta regra pois ela está sendo referenciada." });
         }
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};


// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getSodRules);
router.post("/", passport.authenticate("jwt", { session: false }), createSodRule);
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateSodRule);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteSodRule);

export default router;