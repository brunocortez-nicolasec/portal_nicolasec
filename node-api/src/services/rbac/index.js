// node-api/src/services/rbac/index.js

import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

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
    requiredProfile,       // Para BY_PROFILE
    requiredAttribute,     // Para BY_SINGLE_ATTRIBUTE
    attributeValue,        // Para BY_SINGLE_ATTRIBUTE
    attributeConditions, // Para BY_MULTIPLE_ATTRIBUTES (Array: [{attribute, value}])
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
    requiredAttributeValue: null,
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
      if (!requiredAttribute?.id || attributeValue === null || attributeValue === undefined || String(attributeValue).trim() === '') {
        throw new Error("Para 'Atributo Único', o Atributo e seu Valor são obrigatórios.");
      }
      data.requiredAttributeId = String(requiredAttribute.id); // ID do atributo (ex: "userType")
      data.requiredAttributeValue = String(attributeValue); // Valor esperado
      break;

    case "BY_MULTIPLE_ATTRIBUTES":
      if (!Array.isArray(attributeConditions) || attributeConditions.length === 0) {
        throw new Error("Para 'Múltiplos Atributos', pelo menos uma condição é obrigatória.");
      }
      // Valida cada condição na lista
      attributeConditions.forEach((cond, index) => {
        if (!cond.attribute?.id || cond.value === null || cond.value === undefined || String(cond.value).trim() === '') {
          throw new Error(`Condição de Atributo #${index + 1} inválida. Atributo e Valor são obrigatórios.`);
        }
      });
      // A lógica de salvar/atualizar lidará com a tabela RbacAttributeCondition
      break;

    default:
      throw new Error("Tipo de Condição desconhecido.");
  }

  return data; // Retorna os dados prontos para salvar no RbacRule (exceto attributeConditions)
};


// --- Endpoints CRUD ---

/**
 * @route   GET /rbac-rules
 * @desc    Busca todas as regras RBAC criadas pelo usuário
 * @access  Private
 */
const getRbacRules = async (req, res) => {
  try {
    const rules = await prisma.rbacRule.findMany({
      where: { userId: req.user.id },
      include: {
        // Inclui dados relacionados para exibição
        grantedProfile: { select: { id: true, name: true } }, // Perfil concedido
        requiredProfile: { select: { id: true, name: true } }, // Perfil requerido (se aplicável)
        attributeConditions: true, // Condições de atributos (se aplicável)
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
 * @route   POST /rbac-rules
 * @desc    Cria uma nova regra RBAC
 * @access  Private
 */
const createRbacRule = async (req, res) => {
  try {
    // 1. Validar e preparar dados básicos da regra
    const validatedData = validateAndPrepareRbacData(req.body);

    // 2. Usar transação para criar a regra e suas condições (se houver)
    const newRule = await prisma.$transaction(async (tx) => {
      // Cria a regra principal
      const rule = await tx.rbacRule.create({
        data: {
          ...validatedData, // Inclui name, description, ..., grantedProfileId, requiredProfileId, etc.
          userId: req.user.id,
          // Não inclui 'attributeConditions' diretamente aqui
        },
      });

      // Se for do tipo múltiplos atributos, cria as condições associadas
      if (validatedData.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
        const conditionsToCreate = req.body.attributeConditions.map(cond => ({
          rbacRuleId: rule.id,
          attributeId: String(cond.attribute.id),
          attributeValue: String(cond.value),
        }));
        await tx.rbacAttributeCondition.createMany({
          data: conditionsToCreate,
        });
      }
      return rule; // Retorna a regra principal criada
    });

     // Busca a regra completa recém-criada com includes para retornar ao frontend
     const completeNewRule = await prisma.rbacRule.findUnique({
        where: { id: newRule.id },
        include: {
            grantedProfile: { select: { id: true, name: true } },
            requiredProfile: { select: { id: true, name: true } },
            attributeConditions: true,
        },
    });


    res.status(201).json(completeNewRule);

  } catch (error) {
    console.error("Erro ao criar regra RBAC:", error);
    // Verifica se o erro é de validação (lançado por validateAndPrepareRbacData)
    if (error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("desconhecido") || error.message.includes("iguais")) {
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
 * @route   PATCH /rbac-rules/:id
 * @desc    Atualiza uma regra RBAC
 * @access  Private
 */
const updateRbacRule = async (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }

  try {
     // 1. Validar e preparar dados básicos da regra
     const validatedData = validateAndPrepareRbacData(req.body, true); // Passa isUpdate = true (se precisar de validação diferente)

     // 2. Usar transação para atualizar a regra e suas condições
     const updatedRule = await prisma.$transaction(async (tx) => {

        // Verifica se a regra existe e pertence ao usuário
        const existingRule = await tx.rbacRule.findFirst({
            where: { id: ruleId, userId: req.user.id }
        });
        if (!existingRule) {
            throw new Error("Regra não encontrada ou não pertence a este usuário."); // Lança erro p/ rollback da transação
        }

        // Antes de atualizar a regra principal, lida com as condições de atributo
        // Se a regra *era* de múltiplos atributos, deleta as condições antigas
        if (existingRule.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
            await tx.rbacAttributeCondition.deleteMany({
                where: { rbacRuleId: ruleId }
            });
        }

        // Atualiza a regra principal com os novos dados validados
        const rule = await tx.rbacRule.update({
            where: { id: ruleId },
            data: {
                ...validatedData, // Inclui name, description, ..., grantedProfileId, requiredProfileId, etc.
                userId: req.user.id, // Garante que userId não seja alterado
            },
        });

        // Se o *novo* tipo for múltiplos atributos, cria as novas condições
        if (validatedData.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
            const conditionsToCreate = req.body.attributeConditions.map(cond => ({
                rbacRuleId: rule.id,
                attributeId: String(cond.attribute.id),
                attributeValue: String(cond.value),
            }));
             if (conditionsToCreate.length > 0) {
                await tx.rbacAttributeCondition.createMany({
                    data: conditionsToCreate,
                });
            }
        }
        return rule; // Retorna a regra principal atualizada
    });

     // Busca a regra completa atualizada com includes para retornar ao frontend
     const completeUpdatedRule = await prisma.rbacRule.findUnique({
        where: { id: updatedRule.id },
        include: {
            grantedProfile: { select: { id: true, name: true } },
            requiredProfile: { select: { id: true, name: true } },
            attributeConditions: true,
        },
    });

    res.status(200).json(completeUpdatedRule);

  } catch (error) {
    console.error("Erro ao atualizar regra RBAC:", error);
     if (error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("desconhecido") || error.message.includes("Regra não encontrada") || error.message.includes("iguais")) {
        res.status(400).json({ message: error.message }); // Erros de validação ou 'Not Found' da transação
    } else if (error.code === 'P2002') {
         res.status(409).json({ message: "Já existe uma regra similar." });
    } else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};


/**
 * @route   DELETE /rbac-rules/:id
 * @desc    Deleta uma regra RBAC
 * @access  Private
 */
const deleteRbacRule = async (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }

  try {
     // Usar deleteMany para garantir que só delete se userId corresponder
     // Cascade delete definido no schema cuidará das RbacAttributeCondition associadas
    const deleteResult = await prisma.rbacRule.deleteMany({
      where: {
        id: ruleId,
        userId: req.user.id,
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


// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getRbacRules);
router.post("/", passport.authenticate("jwt", { session: false }), createRbacRule);
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateRbacRule);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteRbacRule);

export default router;