// node-api/src/services/rbac/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// --- Constantes (Copiar dos operadores do frontend para consistência) ---
const validComparisonOperators = [
  "equals", "not_equals", "contains", "starts_with", "ends_with"
];
const validLogicalOperators = ["AND", "OR"];

// --- Funções Helper ---

/**
 * Valida os dados comuns e específicos do tipo de condição RBAC.
 * Retorna um objeto com os dados validados ou lança um erro.
 */
const validateAndPrepareRbacData = (body, isUpdate = false) => {
  const {
    name, description, areaNegocio, processoNegocio, owner,
    conditionType, grantedProfile, // Resultado (Profile Concedido)

    // Campos condicionais (um destes conjuntos será usado)
    requiredProfile,           // Para BY_PROFILE
    requiredAttribute,         // Para BY_SINGLE_ATTRIBUTE
    requiredAttributeOperator, // <<-- NOVO: Operador para BY_SINGLE_ATTRIBUTE
    attributeValue,            // Para BY_SINGLE_ATTRIBUTE
    logicalOperator,           // <<-- Para BY_MULTIPLE_ATTRIBUTES (AND/OR)
    attributeConditions,       // Para BY_MULTIPLE_ATTRIBUTES (Array: [{attribute, operator, value}])
  } = body;

  // 1. Validação básica
  if (!name || !conditionType || !grantedProfile?.id) {
    throw new Error("Nome da Regra, Tipo de Condição e Perfil Concedido são obrigatórios.");
  }

  const data = {
    name,
    description: description || null,
    areaNegocio: areaNegocio || null,
    processoNegocio: processoNegocio || null,
    owner: owner || null,
    conditionType,
    grantedProfileId: parseInt(grantedProfile.id, 10),
    // Zera os campos condicionais por padrão
    requiredProfileId: null,
    requiredAttributeId: null,
    requiredAttributeOperator: null, // <<-- Zera operador single
    requiredAttributeValue: null,
    logicalOperator: null, // <<-- Zera operador multiple
  };

   if (isNaN(data.grantedProfileId)) {
       throw new Error("ID do Perfil Concedido inválido.");
   }

  // 2. Validação e preparação baseada no Tipo de Condição
  switch (conditionType) {
    case "BY_PROFILE":
      if (!requiredProfile?.id) {
        throw new Error("Para 'Concessão por Perfil', o Perfil Requerido é obrigatório.");
      }
      data.requiredProfileId = parseInt(requiredProfile.id, 10);
       if (isNaN(data.requiredProfileId)) {
           throw new Error("ID do Perfil Requerido inválido.");
       }
        // Garante que perfil requerido e concedido não sejam o mesmo
        if (data.requiredProfileId === data.grantedProfileId) {
            throw new Error("O Perfil Requerido e o Perfil Concedido não podem ser iguais.");
        }
      break;

    case "BY_SINGLE_ATTRIBUTE":
      // <<-- Valida Operador -->>
      if (!requiredAttribute?.id || !requiredAttributeOperator || !validComparisonOperators.includes(requiredAttributeOperator) || attributeValue === null || attributeValue === undefined || String(attributeValue).trim() === '') {
        throw new Error("Para 'Atributo Único', o Atributo, Operador Válido e Valor são obrigatórios.");
      }
      data.requiredAttributeId = String(requiredAttribute.id); // ID do atributo (ex: "userType")
      data.requiredAttributeOperator = requiredAttributeOperator; // <<-- Adiciona operador aos dados
      data.requiredAttributeValue = String(attributeValue); // Valor esperado
      break;

    case "BY_MULTIPLE_ATTRIBUTES":
       // <<-- Valida Logical Operator -->>
       if (!logicalOperator || !validLogicalOperators.includes(logicalOperator)) {
           throw new Error("Para 'Múltiplos Atributos', um Operador Lógico válido (AND/OR) é obrigatório.");
       }
      data.logicalOperator = logicalOperator; // <<-- Adiciona operador lógico aos dados

      if (!Array.isArray(attributeConditions) || attributeConditions.length === 0) {
        throw new Error("Para 'Múltiplos Atributos', pelo menos uma condição é obrigatória.");
      }
      // Valida cada condição na lista
      attributeConditions.forEach((cond, index) => {
        // <<-- Valida Operador em cada condição -->>
        if (!cond.attribute?.id || !cond.operator || !validComparisonOperators.includes(cond.operator) || cond.value === null || cond.value === undefined || String(cond.value).trim() === '') {
          throw new Error(`Condição #${index + 1} inválida. Atributo, Operador Válido e Valor são obrigatórios.`);
        }
      });
      // A lógica de salvar/atualizar lidará com a tabela RbacAttributeCondition
      break;

    default:
      throw new Error("Tipo de Condição desconhecido.");
  }

  return data; // Retorna os dados prontos para salvar/atualizar no RbacRule
};


// --- Endpoints CRUD ---

/**
 * @route    GET /rbac-rules
 * @desc     Busca todas as regras RBAC criadas pelo usuário
 * @access   Private
 */
const getRbacRules = async (req, res) => {
  try {
    // Garante que o userId seja um Int. Ajuste se o seu ID for String.
    const userIdInt = parseInt(req.user.id, 10);
     if (isNaN(userIdInt)) {
         return res.status(400).json({ message: "ID de usuário inválido." });
     }

    const rules = await prisma.rbacRule.findMany({
      where: { userId: userIdInt }, // Usa o ID como Int
      include: {
        // Inclui dados relacionados para exibição
        grantedProfile: { select: { id: true, name: true } }, // Perfil concedido
        requiredProfile: { select: { id: true, name: true } }, // Perfil requerido (se aplicável)
        attributeConditions: true, // Já inclui o novo campo 'operator'
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(rules);
  } catch (error) {
    console.error("Erro ao buscar regras RBAC:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route    POST /rbac-rules
 * @desc     Cria uma nova regra RBAC
 * @access   Private
 */
const createRbacRule = async (req, res) => {
  try {
    // 1. Validar e preparar dados (já inclui operadores agora)
    const validatedData = validateAndPrepareRbacData(req.body);

    // Garante que o userId seja um Int. Ajuste se o seu ID for String.
    const userIdInt = parseInt(req.user.id, 10);
     if (isNaN(userIdInt)) {
         throw new Error("ID de usuário inválido para criação."); // Lança erro para rollback
     }

    // 2. Usar transação
    const newRule = await prisma.$transaction(async (tx) => {
      // Cria a regra principal (incluindo operadores single e logical)
      const rule = await tx.rbacRule.create({
        data: {
          ...validatedData,
          userId: userIdInt, // Usa o ID como Int
        },
      });

      // Se for múltiplos atributos, cria as condições associadas (incluindo operador)
      if (validatedData.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
        // Certifica-se de que req.body.attributeConditions existe e é um array
         if (!Array.isArray(req.body.attributeConditions)) {
             throw new Error("Formato inválido para attributeConditions.");
         }
        const conditionsToCreate = req.body.attributeConditions.map(cond => {
           // Adiciona verificação para 'cond.attribute'
           if (!cond.attribute || typeof cond.attribute.id === 'undefined') {
               throw new Error(`Condição inválida: atributo ausente ou sem ID.`);
           }
           if (typeof cond.operator === 'undefined') {
              throw new Error(`Condição inválida: operador ausente.`);
           }
           if (typeof cond.value === 'undefined') {
              throw new Error(`Condição inválida: valor ausente.`);
           }
          return {
              rbacRuleId: rule.id,
              attributeId: String(cond.attribute.id),
              operator: cond.operator, // <<-- Salva o operador da condição
              attributeValue: String(cond.value),
          };
        });
        // Só tenta criar se houver condições
         if (conditionsToCreate.length > 0) {
             await tx.rbacAttributeCondition.createMany({
                 data: conditionsToCreate,
             });
         }
      }
      return rule; // Retorna a regra principal criada

     });

      // Busca a regra completa para retornar
      const completeNewRule = await prisma.rbacRule.findUnique({
        where: { id: newRule.id },
        include: {
            grantedProfile: { select: { id: true, name: true } },
            requiredProfile: { select: { id: true, name: true } },
            attributeConditions: true,
        },
    });

     // Verifica se a busca foi bem-sucedida antes de enviar a resposta
     if (!completeNewRule) {
         throw new Error("Falha ao buscar a regra recém-criada.");
     }

    res.status(201).json(completeNewRule);

  } catch (error) {
    console.error("Erro ao criar regra RBAC:", error);
    // Verifica se o erro é de validação (lançado por validateAndPrepareRbacData ou dentro da transação)
    if (error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("desconhecido") || error.message.includes("iguais") || error.message.includes("Condição inválida")) {
        res.status(400).json({ message: error.message });
    } else if (error.code === 'P2002') { // Erro de unique constraint (se aplicável no futuro)
         res.status(409).json({ message: "Já existe uma regra similar." });
    }
     else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};

/**
 * @route    PATCH /rbac-rules/:id
 * @desc     Atualiza uma regra RBAC
 * @access   Private
 */
const updateRbacRule = async (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }

   // Garante que o userId seja um Int. Ajuste se o seu ID for String.
   const userIdInt = parseInt(req.user.id, 10);
   if (isNaN(userIdInt)) {
       return res.status(400).json({ message: "ID de usuário inválido." });
   }

  try {

       // 1. Validar e preparar dados (já inclui operadores)
       const validatedData = validateAndPrepareRbacData(req.body, true);

       // 2. Usar transação
       const updatedRule = await prisma.$transaction(async (tx) => {

         // Verifica se a regra existe e pertence ao usuário
         const existingRule = await tx.rbacRule.findFirst({
             where: { id: ruleId, userId: userIdInt } // Usa o ID como Int
         });
         if (!existingRule) {
             throw new Error("Regra não encontrada ou não pertence a este usuário."); // Lança erro p/ rollback da transação
         }


         // Deleta condições antigas ANTES de atualizar a regra principal
         // (Necessário se o TIPO mudou de MULTIPLE para outro, ou para limpar antes de recriar)
         await tx.rbacAttributeCondition.deleteMany({
           where: { rbacRuleId: ruleId }
         });

         // Atualiza a regra principal (inclui operadores single e logical)
         const rule = await tx.rbacRule.update({
             where: { id: ruleId },
             data: {
                 ...validatedData,
                 // Não atualiza userId aqui para garantir que o dono não mude
             },
         });

         // Se o *novo* tipo for múltiplos atributos, cria as novas condições
         if (validatedData.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
             // Certifica-se de que req.body.attributeConditions existe e é um array
              if (!Array.isArray(req.body.attributeConditions)) {
                 throw new Error("Formato inválido para attributeConditions.");
              }
             const conditionsToCreate = req.body.attributeConditions.map(cond => {
                 // Adiciona verificação para 'cond.attribute'
                 if (!cond.attribute || typeof cond.attribute.id === 'undefined') {
                     throw new Error(`Condição inválida: atributo ausente ou sem ID.`);
                 }
                  if (typeof cond.operator === 'undefined') {
                     throw new Error(`Condição inválida: operador ausente.`);
                  }
                  if (typeof cond.value === 'undefined') {
                     throw new Error(`Condição inválida: valor ausente.`);
                  }
                 return {
                     rbacRuleId: rule.id,
                     attributeId: String(cond.attribute.id),
                     operator: cond.operator, // <<-- Salva o operador da condição
                     attributeValue: String(cond.value),
                 };
             });
              // Só tenta criar se houver condições
              if (conditionsToCreate.length > 0) {
                  await tx.rbacAttributeCondition.createMany({
                      data: conditionsToCreate,
                  });
              }
         }
         return rule; // Retorna a regra principal atualizada
     });

      // Busca a regra completa atualizada
      const completeUpdatedRule = await prisma.rbacRule.findUnique({
        where: { id: updatedRule.id },
        include: {
            grantedProfile: { select: { id: true, name: true } },
            requiredProfile: { select: { id: true, name: true } },
            attributeConditions: true,
        },
    });

     // Verifica se a busca foi bem-sucedida
     if (!completeUpdatedRule) {
         throw new Error("Falha ao buscar a regra atualizada.");
     }

    res.status(200).json(completeUpdatedRule);

  } catch (error) {
    console.error("Erro ao atualizar regra RBAC:", error);
     // Verifica erros de validação ou de 'não encontrado'
     if (error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("desconhecido") || error.message.includes("Regra não encontrada") || error.message.includes("iguais") || error.message.includes("Condição inválida")) {
        res.status(400).json({ message: error.message });
    } else if (error.code === 'P2002') {
         res.status(409).json({ message: "Já existe uma regra similar." });
    } else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};


/**
 * @route    DELETE /rbac-rules/:id
 * @desc     Deleta uma regra RBAC
 * @access   Private
 */
const deleteRbacRule = async (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }

   // Garante que o userId seja um Int. Ajuste se o seu ID for String.
   const userIdInt = parseInt(req.user.id, 10);
   if (isNaN(userIdInt)) {
       return res.status(400).json({ message: "ID de usuário inválido." });
   }

  try {
     // Usar deleteMany para garantir que só delete se userId corresponder
       // Cascade delete definido no schema cuidará das RbacAttributeCondition associadas
       const deleteResult = await prisma.rbacRule.deleteMany({
        where: {
          id: ruleId,
          userId: userIdInt, // Usa o ID como Int
        },
      });

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Regra RBAC não encontrada ou não pertence a este usuário." });
    }

    res.status(204).send(); // Sucesso, sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar regra RBAC:", error);
    // Verifica erro P2003 (Foreign key constraint failed) - pode ocorrer se algo depender desta regra
    if (error.code === 'P2003') {
         res.status(409).json({ message: "Não é possível deletar esta regra pois ela está sendo referenciada em outro lugar." });
    } else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};


// --- Definição das Rotas (Sem alterações) ---
router.get("/", passport.authenticate("jwt", { session: false }), getRbacRules);
router.post("/", passport.authenticate("jwt", { session: false }), createRbacRule);
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateRbacRule);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteRbacRule);

export default router;