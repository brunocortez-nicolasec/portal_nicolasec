// node-api/src/services/sod/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// --- Constantes ---
// Reutiliza os operadores de comparação (mesmos IDs do frontend/RBAC)
const validComparisonOperators = [
  "equals", "not_equals", "contains", "starts_with", "ends_with"
];

// Mapeamento de Tipos de Regra para Tipos de Valor A e B
const typeMapping = {
  ROLE_X_ROLE:   { a: "PROFILE",   b: "PROFILE"   },
  ATTR_X_ROLE:   { a: "ATTRIBUTE", b: "PROFILE"   },
  ATTR_X_SYSTEM: { a: "ATTRIBUTE", b: "SYSTEM"    },
  // Adicionar outros mapeamentos se houver mais ruleTypes
};

/**
 * Helper para validar e extrair os dados dinâmicos do request body.
 * Inclui validação para valueAOperator e valueAValue quando aplicável.
 */
const extractDynamicValues = (ruleTypeId, valueA, valueB, valueAOperator, valueAValue) => { // <<< Adiciona valueAOperator, valueAValue
  const mapping = typeMapping[ruleTypeId];
  if (!mapping) {
    throw new Error("Tipo de regra inválido.");
  }

  if (!valueA || !valueB) {
    throw new Error("Valores de comparação A e B são obrigatórios.");
  }

  // Extrai IDs (vem como objeto {id: ...} do frontend)
  const valueAIdRaw = valueA?.id;
  const valueBIdRaw = valueB?.id;

  if (valueAIdRaw === null || valueAIdRaw === undefined || valueBIdRaw === null || valueBIdRaw === undefined) {
    throw new Error("IDs dos valores de comparação A ou B estão faltando.");
  }

  // Converte IDs para String (como definido no schema)
  const valueAId = String(valueAIdRaw);
  const valueBId = String(valueBIdRaw);

  // Campos específicos para Atributo A
  let finalValueAOperator = null;
  let finalValueAValue = null;

  // Valida operador e valor APENAS se o tipo A for Atributo
  if (mapping.a === "ATTRIBUTE") {
    if (!valueAOperator || !validComparisonOperators.includes(valueAOperator)) {
      throw new Error("Operador inválido ou ausente para o Atributo A.");
    }
    if (valueAValue === null || valueAValue === undefined || String(valueAValue).trim() === '') {
      throw new Error("Valor ausente ou inválido para o Atributo A.");
    }
    finalValueAOperator = valueAOperator;
    finalValueAValue = String(valueAValue);
  } else {
     // Garante que operador/valor sejam nulos se não for atributo
     if (valueAOperator || valueAValue) {
       console.warn("Operador/Valor A fornecidos para um tipo não-atributo, serão ignorados.");
     }
  }


  // Impede que as *seleções* sejam idênticas se forem do mesmo tipo
  // (Ex: Perfil Admin vs Perfil Admin)
  // NOTA: Para atributos, isso só compara o ID do atributo (ex: 'status' vs 'status'),
  // não o operador/valor. A verificação de duplicata exata será feita depois.
  if (mapping.a === mapping.b && valueAId === valueBId) {
    throw new Error("As seleções de comparação não podem ser iguais quando são do mesmo tipo.");
  }

  // Normaliza a ordem se ambos os tipos forem iguais (ex: ROLE_X_ROLE)
  // Isso NÃO se aplica se for ATTR_X_ATTR, pois operador/valor podem diferenciar
  if (mapping.a === mapping.b && mapping.a !== "ATTRIBUTE") { // <<-- NÃO normaliza se for Atributo
    if (valueAId.localeCompare(valueBId) > 0) {
      // Inverte A e B para consistência (ex: sempre salva Perfil1 vs Perfil2, nunca Perfil2 vs Perfil1)
      return {
          valueAType: mapping.b, valueAId: valueBId,
          valueAOperator: null, valueAValue: null, // Zera campos de A (que agora é B)
          valueBType: mapping.a, valueBId: valueAId,
      };
    }
  }

  // Retorna os tipos, IDs e os novos campos de Atributo A
  return {
    valueAType: mapping.a, valueAId: valueAId,
    valueAOperator: finalValueAOperator, // <<-- Retorna operador validado
    valueAValue: finalValueAValue,       // <<-- Retorna valor validado
    valueBType: mapping.b, valueBId: valueBId,
  };
};

/**
 * Helper para buscar regra duplicada, considerando operador e valor.
 */
const findExistingRule = async (prismaArgs) => {
    // A query base já inclui userId, valueAType, valueAId, valueBType, valueBId
    const query = { ...prismaArgs };

    // Se valueAType for ATTRIBUTE, adiciona operador e valor à busca
    if (prismaArgs.valueAType === "ATTRIBUTE") {
      query.valueAOperator = prismaArgs.valueAOperator;
      query.valueAValue = prismaArgs.valueAValue;
    } else {
       // Garante que não busque por operador/valor se não for atributo
       query.valueAOperator = null;
       query.valueAValue = null;
    }

    // Remove os campos que não fazem parte direta da query where única
    // (eles foram usados para construir a query acima)
    // delete query.valueAOperator;
    // delete query.valueAValue;

    return await prisma.sodRule.findFirst({ where: query });
};


/**
 * @route    GET /sod-rules
 * @desc     Busca todas as regras de SOD criadas pelo usuário
 * @access   Private
 */
const getSodRules = async (req, res) => {
 try {
   // Garante que userId seja Int
   const userIdInt = parseInt(req.user.id, 10);
   if (isNaN(userIdInt)) {
       return res.status(400).json({ message: "ID de usuário inválido." });
   }

   const rules = await prisma.sodRule.findMany({
     where: { userId: userIdInt },
     // SELECT inclui os novos campos valueAOperator e valueAValue
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
         valueAOperator: true, // <<< Incluído
         valueAValue: true,    // <<< Incluído
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
 * @route    POST /sod-rules
 * @desc     Cria uma nova regra de SOD (com campos dinâmicos e operador/valor)
 * @access   Private
 */
const createSodRule = async (req, res) => {
 // Extrai os novos campos do body
 const { name, description, areaNegocio, processoNegocio, owner,
         ruleTypeId, valueA, valueB, valueAOperator, valueAValue // <<< Novos campos aqui
        } = req.body;

 if (!name || !ruleTypeId) {
   return res.status(400).json({ message: "Nome e Tipo de Regra são obrigatórios." });
 }

  // Garante que userId seja Int
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
       // Não retorna direto, lança erro para ser pego pelo catch e retornar 500 ou 400
       return res.status(400).json({ message: "ID de usuário inválido para criação."});
  }


 try {
   // Passa os novos campos para a validação/extração
   const dynamicValues = extractDynamicValues(ruleTypeId, valueA, valueB, valueAOperator, valueAValue);

   // Prepara argumentos para buscar duplicata (inclui operador/valor)
   const duplicateCheckArgs = {
       userId: userIdInt,
       valueAType: dynamicValues.valueAType,
       valueAId: dynamicValues.valueAId,
       valueAOperator: dynamicValues.valueAOperator, // Pode ser null
       valueAValue: dynamicValues.valueAValue,       // Pode ser null
       valueBType: dynamicValues.valueBType,
       valueBId: dynamicValues.valueBId,
   };

   const existingRule = await findExistingRule(duplicateCheckArgs);

   if (existingRule) {
     return res.status(409).json({ message: "Uma regra de conflito idêntica (incluindo operador/valor do atributo) já existe." });
   }

   // Cria a regra no banco (inclui operador/valor)
   const newRule = await prisma.sodRule.create({
     data: {
       name,
       description: description || null,
       areaNegocio: areaNegocio || null,
       processoNegocio: processoNegocio || null,
       owner: owner || null,
       userId: userIdInt,
       ruleType: ruleTypeId,
       // dynamicValues agora contém valueAOperator e valueAValue validados (ou null)
       ...dynamicValues,
     },
   });

   res.status(201).json(newRule);
 } catch (error) {
   console.error("Erro ao criar regra de SOD:", error);
   // Mensagem de erro mais específica para validação
   const isValidationError = error.message.includes("Tipo de regra inválido") ||
                             error.message.includes("Valores de comparação") ||
                             error.message.includes("IDs dos valores") ||
                             error.message.includes("Operador inválido") ||
                             error.message.includes("Valor ausente");
   res.status(isValidationError ? 400 : 500)
      .json({ message: error.message || "Erro interno do servidor." });
 }
};

/**
 * @route    PATCH /sod-rules/:id
 * @desc     Atualiza uma regra de SOD (com campos dinâmicos e operador/valor)
 * @access   Private
 */
const updateSodRule = async (req, res) => {
 const ruleId = parseInt(req.params.id, 10);
 // Extrai os novos campos do body
 const { name, description, areaNegocio, processoNegocio, owner,
         ruleTypeId, valueA, valueB, valueAOperator, valueAValue // <<< Novos campos aqui
        } = req.body;

 // Garante que userId seja Int
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
   // Passa os novos campos para a validação/extração
   const dynamicValues = extractDynamicValues(ruleTypeId, valueA, valueB, valueAOperator, valueAValue);

   // Verifica se a regra a ser atualizada existe e pertence ao usuário
   const rule = await prisma.sodRule.findFirst({
     where: { id: ruleId, userId: userIdInt },
   });

   if (!rule) {
     return res.status(404).json({ message: "Regra não encontrada ou não pertence a este usuário." });
   }

   // Prepara argumentos para buscar duplicata (excluindo a própria regra sendo editada)
   const duplicateCheckArgs = {
       userId: userIdInt,
       valueAType: dynamicValues.valueAType,
       valueAId: dynamicValues.valueAId,
       valueAOperator: dynamicValues.valueAOperator, // Pode ser null
       valueAValue: dynamicValues.valueAValue,       // Pode ser null
       valueBType: dynamicValues.valueBType,
       valueBId: dynamicValues.valueBId,
       id: { not: ruleId }, // Exclui a regra atual da verificação
   };

   const existingRule = await findExistingRule(duplicateCheckArgs);

   if (existingRule) {
     return res.status(409).json({ message: "Uma regra de conflito idêntica (incluindo operador/valor do atributo) já existe." });
   }

   // Atualiza a regra no banco (inclui operador/valor)
   const updatedRule = await prisma.sodRule.update({
     where: { id: ruleId },
     data: {
       name,
       description: description || null,
       areaNegocio: areaNegocio || null,
       processoNegocio: processoNegocio || null,
       owner: owner || null,
       ruleType: ruleTypeId,
       // dynamicValues agora contém valueAOperator e valueAValue validados (ou null)
       ...dynamicValues,
     },
   });

   res.status(200).json(updatedRule);
 } catch (error) {
   console.error("Erro ao atualizar regra de SOD:", error);
   // Mensagem de erro mais específica para validação
   const isValidationError = error.message.includes("Tipo de regra inválido") ||
                             error.message.includes("Valores de comparação") ||
                             error.message.includes("IDs dos valores") ||
                             error.message.includes("Operador inválido") ||
                             error.message.includes("Valor ausente");
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
   // Garante que userId seja Int
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
               userId: userIdInt, // Usa Int
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