// node-api/src/services/sod/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// ======================= INÍCIO DA CORREÇÃO =======================

// Mapeamento simplificado: Define apenas os TIPOS esperados
const typeMapping = {
  ROLE_X_ROLE:   { a: "PROFILE",   b: "PROFILE"   },
  ATTR_X_ROLE:   { a: "ATTRIBUTE", b: "PROFILE"   },
  ATTR_X_SYSTEM: { a: "ATTRIBUTE", b: "SYSTEM"    },
};

/**
 * Helper para validar e extrair os dados dinâmicos do request body.
 * Garante que os IDs sejam tratados como strings.
 */
const extractDynamicValues = (ruleTypeId, valueA, valueB) => {
  const mapping = typeMapping[ruleTypeId];
  if (!mapping) {
    throw new Error("Tipo de regra inválido.");
  }

  if (!valueA || !valueB) {
    throw new Error("Valores de comparação A e B são obrigatórios.");
  }

  // Extrai os IDs e garante que sejam strings
  const valueAIdRaw = valueA?.id ?? valueA;
  const valueBIdRaw = valueB?.id ?? valueB;

  if (valueAIdRaw === null || valueAIdRaw === undefined || valueBIdRaw === null || valueBIdRaw === undefined) {
    throw new Error("IDs dos valores de comparação A ou B estão faltando.");
  }

  // Converte explicitamente para String
  const valueAId = String(valueAIdRaw);
  const valueBId = String(valueBIdRaw);

  // Impede que os valores sejam idênticos *se* forem do mesmo tipo
  if (mapping.a === mapping.b && valueAId === valueBId) {
    throw new Error("Os valores de comparação não podem ser iguais quando são do mesmo tipo.");
  }

  // Normaliza a ordem se ambos os tipos forem iguais (comparando como strings)
  if (mapping.a === mapping.b) {
    // Compara strings diretamente
    if (valueAId.localeCompare(valueBId) > 0) { // Se valueAId vem depois de valueBId alfabeticamente/numericamente
        return {
            valueAType: mapping.b, valueAId: valueBId, // Inverte
            valueBType: mapping.a, valueBId: valueAId
        };
    }
  }

  // Retorna os tipos e IDs como strings
  return {
    valueAType: mapping.a, valueAId: valueAId,
    valueBType: mapping.b, valueBId: valueBId,
  };
};
// ======================= FIM DA CORREÇÃO =======================


/**
 * Helper para buscar regra duplicada.
 */
const findExistingRule = async (prismaArgs) => {
    // Prisma espera Strings para valueAId e valueBId aqui, o que está correto agora
    return await prisma.sodRule.findFirst({ where: prismaArgs });
};


/**
 * @route   GET /sod-rules
 * @desc    Busca todas as regras de SOD criadas pelo usuário
 * @access  Private
 */
const getSodRules = async (req, res) => {
  // ... (função getSodRules sem alterações) ...
  try {
    const rules = await prisma.sodRule.findMany({
      where: { userId: req.user.id },
      select: {
          id: true,
          name: true,
          description: true,
          areaNegocio: true,
          processoNegocio: true,
          owner: true,
          ruleType: true,
          valueAType: true,
          valueAId: true,
          valueBType: true,
          valueBId: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
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
 * @route   POST /sod-rules
 * @desc    Cria uma nova regra de SOD (com campos dinâmicos)
 * @access  Private
 */
const createSodRule = async (req, res) => {
  // ... (função createSodRule sem alterações na lógica principal,
  //      mas agora receberá IDs como strings de extractDynamicValues) ...
  const { name, description, areaNegocio, processoNegocio, owner, ruleTypeId, valueA, valueB } = req.body;

  if (!name || !ruleTypeId) {
    return res.status(400).json({ message: "Nome e Tipo de Regra são obrigatórios." });
  }

  try {
    const dynamicValues = extractDynamicValues(ruleTypeId, valueA, valueB); // Agora retorna IDs como strings

     const existingRule = await findExistingRule({
        userId: req.user.id,
        valueAType: dynamicValues.valueAType,
        valueAId: dynamicValues.valueAId, // É string
        valueBType: dynamicValues.valueBType,
        valueBId: dynamicValues.valueBId, // É string
    });

    if (existingRule) {
      return res.status(409).json({ message: "Uma regra de conflito para esta combinação já existe." });
    }

    const newRule = await prisma.sodRule.create({
      data: {
        name,
        description: description || null,
        areaNegocio: areaNegocio || null,
        processoNegocio: processoNegocio || null,
        owner: owner || null,
        userId: req.user.id,
        ruleType: ruleTypeId,
        ...dynamicValues, // valueAId e valueBId são strings
      },
    });

    res.status(201).json(newRule);
  } catch (error) {
    console.error("Erro ao criar regra de SOD:", error);
    res.status(error.message.includes("Tipo de regra inválido") || error.message.includes("Valores de comparação") || error.message.includes("IDs dos valores") ? 400 : 500)
       .json({ message: error.message || "Erro interno do servidor." });
  }
};

/**
 * @route   PATCH /sod-rules/:id
 * @desc    Atualiza uma regra de SOD (com campos dinâmicos)
 * @access  Private
 */
const updateSodRule = async (req, res) => {
  // ... (função updateSodRule sem alterações na lógica principal,
  //      mas agora receberá IDs como strings de extractDynamicValues) ...
  const ruleId = parseInt(req.params.id, 10);
  const { name, description, areaNegocio, processoNegocio, owner, ruleTypeId, valueA, valueB } = req.body;

  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }
  if (!name || !ruleTypeId) {
    return res.status(400).json({ message: "Nome e Tipo de Regra são obrigatórios." });
  }

  try {
    const dynamicValues = extractDynamicValues(ruleTypeId, valueA, valueB); // Agora retorna IDs como strings

    const rule = await prisma.sodRule.findFirst({
      where: { id: ruleId, userId: req.user.id },
    });

    if (!rule) {
      return res.status(404).json({ message: "Regra não encontrada ou não pertence a este usuário." });
    }

     const existingRule = await findExistingRule({
        userId: req.user.id,
        valueAType: dynamicValues.valueAType,
        valueAId: dynamicValues.valueAId, // É string
        valueBType: dynamicValues.valueBType,
        valueBId: dynamicValues.valueBId, // É string
        id: { not: ruleId },
    });

    if (existingRule) {
      return res.status(409).json({ message: "Uma regra de conflito para esta combinação já existe." });
    }

    const updatedRule = await prisma.sodRule.update({
      where: { id: ruleId },
      data: {
        name,
        description: description || null,
        areaNegocio: areaNegocio || null,
        processoNegocio: processoNegocio || null,
        owner: owner || null,
        ruleType: ruleTypeId,
        ...dynamicValues, // valueAId e valueBId são strings
      },
    });

    res.status(200).json(updatedRule);
  } catch (error) {
    console.error("Erro ao atualizar regra de SOD:", error);
     res.status(error.message.includes("Tipo de regra inválido") || error.message.includes("Valores de comparação") || error.message.includes("IDs dos valores") ? 400 : 500)
        .json({ message: error.message || "Erro interno do servidor." });
  }
};

/**
 * @route   DELETE /sod-rules/:id
 * @desc    Deleta uma regra de SOD
 * @access  Private
 */
const deleteSodRule = async (req, res) => {
  // ... (função deleteSodRule sem alterações) ...
    const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }

  try {
    const deleteResult = await prisma.sodRule.deleteMany({
      where: {
        id: ruleId,
        userId: req.user.id,
      },
    });

    if (deleteResult.count === 0) {
       return res.status(404).json({ message: "Regra não encontrada ou não pertence a este usuário." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar regra de SOD:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getSodRules);
router.post("/", passport.authenticate("jwt", { session: false }), createSodRule);
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateSodRule);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteSodRule);

export default router;