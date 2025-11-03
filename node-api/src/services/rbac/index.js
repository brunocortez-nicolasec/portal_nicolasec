import express from "express";
import passport from "passport";
// Importar 'Prisma' para checagem de erros
import { PrismaClient, Prisma } from "@prisma/client";

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
 * (Atualizado para incluir systemId e validar perfis contra o sistema)
 */
// validateAndPrepareRbacData agora é async para validar perfis no DB
const validateAndPrepareRbacData = async (body, isUpdate = false) => {
  const {
    name, description, areaNegocio, processoNegocio, owner,
    systemId, // <<< NOVO: ID do Sistema ao qual a regra pertence
    conditionType, grantedProfile, // Resultado (Profile Concedido)

    // Campos condicionais (um destes conjuntos será usado)
    requiredProfile,           // Para BY_PROFILE
    requiredAttribute,         // Para BY_SINGLE_ATTRIBUTE
    requiredAttributeOperator, // <<-- NOVO: Operador para BY_SINGLE_ATTRIBUTE
    attributeValue,            // Para BY_SINGLE_ATTRIBUTE
    logicalOperator,           // <<-- Para BY_MULTIPLE_ATTRIBUTES (AND/OR)
    attributeConditions,       // Para BY_MULTIPLE_ATTRIBUTES (Array: [{attribute, operator, value}])
  } = body;

  // 1. Validação básica (inclui systemId)
  if (!name || !conditionType || !grantedProfile?.id) {
    throw new Error("Nome da Regra, Tipo de Condição e Perfil Concedido são obrigatórios.");
  }
  const systemIdInt = parseInt(systemId, 10);
  if (isNaN(systemIdInt)) {
      throw new Error("ID do Sistema (systemId) é obrigatório e deve ser um número.");
  }

  // --- Validação de Perfil vs Sistema ---
  // Verifica se o Perfil Concedido pertence ao Sistema fornecido
  const grantedProfileRecord = await prisma.profile.findFirst({
      where: { id: parseInt(grantedProfile.id, 10), systemId: systemIdInt }
  });
  if (!grantedProfileRecord) {
      throw new Error(`Perfil Concedido (ID: ${grantedProfile.id}) não encontrado ou não pertence ao Sistema (ID: ${systemIdInt}).`);
  }
  // --- Fim da Validação ---

  const data = {
    name,
    description: description || null,
    areaNegocio: areaNegocio || null,
    processoNegocio: processoNegocio || null,
    owner: owner || null,
    systemId: systemIdInt, // <<< NOVO: Adiciona systemId
    conditionType,
    grantedProfileId: parseInt(grantedProfile.id, 10),
    // Zera os campos condicionais por padrão
    requiredProfileId: null,
    requiredAttributeId: null,
    requiredAttributeOperator: null,
    requiredAttributeValue: null,
    logicalOperator: null,
  };

  if (isNaN(data.grantedProfileId)) {
    throw new Error("ID do Perfil Concedido inválido.");
  }

  // 2. Validação baseada no Tipo de Condição
  switch (conditionType) {
    case "BY_PROFILE":
      if (!requiredProfile?.id) {
        throw new Error("Para 'Concessão por Perfil', o Perfil Requerido é obrigatório.");
      }
      data.requiredProfileId = parseInt(requiredProfile.id, 10);
      if (isNaN(data.requiredProfileId)) {
        throw new Error("ID do Perfil Requerido inválido.");
      }
      
      // --- Validação de Perfil vs Sistema ---
      const requiredProfileRecord = await prisma.profile.findFirst({
          where: { id: data.requiredProfileId, systemId: systemIdInt }
      });
      if (!requiredProfileRecord) {
           throw new Error(`Perfil Requerido (ID: ${data.requiredProfileId}) não encontrado ou não pertence ao Sistema (ID: ${systemIdInt}).`);
      }
      // --- Fim da Validação ---

      if (data.requiredProfileId === data.grantedProfileId) {
        throw new Error("O Perfil Requerido e o Perfil Concedido não podem ser iguais.");
      }
      break;

    case "BY_SINGLE_ATTRIBUTE":
      // (Assumindo que Atributos são da Identity, nenhuma mudança aqui)
      if (!requiredAttribute?.id || !requiredAttributeOperator || !validComparisonOperators.includes(requiredAttributeOperator) || attributeValue === null || attributeValue === undefined || String(attributeValue).trim() === '') {
        throw new Error("Para 'Atributo Único', o Atributo, Operador Válido e Valor são obrigatórios.");
      }
      data.requiredAttributeId = String(requiredAttribute.id);
      data.requiredAttributeOperator = requiredAttributeOperator;
      data.requiredAttributeValue = String(attributeValue);
      break;

    case "BY_MULTIPLE_ATTRIBUTES":
      // (Assumindo que Atributos são da Identity, nenhuma mudança aqui)
      if (!logicalOperator || !validLogicalOperators.includes(logicalOperator)) {
        throw new Error("Para 'Múltiplos Atributos', um Operador Lógico válido (AND/OR) é obrigatório.");
      }
      data.logicalOperator = logicalOperator;

      if (!Array.isArray(attributeConditions) || attributeConditions.length === 0) {
        throw new Error("Para 'Múltiplos Atributos', pelo menos uma condição é obrigatória.");
      }
      attributeConditions.forEach((cond, index) => {
        if (!cond.attribute?.id || !cond.operator || !validComparisonOperators.includes(cond.operator) || cond.value === null || cond.value === undefined || String(cond.value).trim() === '') {
          throw new Error(`Condição #${index + 1} inválida. Atributo, Operador Válido e Valor são obrigatórios.`);
        }
      });
      break;

    default:
      throw new Error("Tipo de Condição desconhecido.");
  }

  return data; // Retorna os dados prontos (incluindo systemId)
};


// --- Endpoints CRUD ---

/**
 * @route    GET /rbac-rules
 * @desc     Busca todas as regras RBAC (agora inclui info do sistema)
 * @access   Private
 * @query    ?systemId=<ID> (Opcional)
 */
const getRbacRules = async (req, res) => {
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
            whereClause.systemId = systemIdInt;
        } else {
             return res.status(400).json({ message: "systemId inválido." });
        }
    }

    const rules = await prisma.rbacRule.findMany({
      where: whereClause, // Aplica filtros
      include: {
        // --- Inclui Sistema e Perfis ---
        system: { select: { id: true, name: true } }, // <<< INCLUÍDO
        grantedProfile: { select: { id: true, name: true, systemId: true } }, // Inclui systemId do perfil
        requiredProfile: { select: { id: true, name: true, systemId: true } },
        attributeConditions: true,
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
 * @desc     Cria uma nova regra RBAC (agora requer systemId)
 * @access   Private
 */
const createRbacRule = async (req, res) => {
  try {
    // 1. Validar e preparar dados (agora é async e valida systemId/perfis)
    // O body agora DEVE conter systemId e os perfis (grantedProfile, requiredProfile)
    // devem ser objetos { id: ... } que pertencem àquele systemId.
    const validatedData = await validateAndPrepareRbacData(req.body);

    const userIdInt = parseInt(req.user.id, 10);
    if (isNaN(userIdInt)) {
        throw new Error("ID de usuário inválido para criação.");
    }

    // 2. Usar transação
    const newRule = await prisma.$transaction(async (tx) => {
      // Cria a regra principal (agora inclui systemId)
      const rule = await tx.rbacRule.create({
        data: {
          ...validatedData, // validatedData já contém systemId
          userId: userIdInt,
        },
      });

      // Lógica de Múltiplos Atributos (sem alteração, assume atributos da Identity)
      if (validatedData.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
        if (!Array.isArray(req.body.attributeConditions)) {
            throw new Error("Formato inválido para attributeConditions.");
        }
        const conditionsToCreate = req.body.attributeConditions.map(cond => {
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
            operator: cond.operator,
            attributeValue: String(cond.value),
          };
        });
        if (conditionsToCreate.length > 0) {
            await tx.rbacAttributeCondition.createMany({
                data: conditionsToCreate,
            });
        }
      }
      return rule;
     });

      // Busca a regra completa para retornar (incluindo o sistema)
      const completeNewRule = await prisma.rbacRule.findUnique({
        where: { id: newRule.id },
        include: {
            system: { select: { id: true, name: true } }, // <<< INCLUÍDO
            grantedProfile: { select: { id: true, name: true } },
            requiredProfile: { select: { id: true, name: true } },
            attributeConditions: true,
        },
    });

    if (!completeNewRule) {
        throw new Error("Falha ao buscar a regra recém-criada.");
    }

    res.status(201).json(completeNewRule);

  } catch (error) {
    console.error("Erro ao criar regra RBAC:", error);
    // Erros de validação (incluindo os novos de perfil/sistema)
    if (error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("desconhecido") || error.message.includes("iguais") || error.message.includes("Condição inválida") || error.message.includes("não encontrado ou não pertence")) {
        res.status(400).json({ message: error.message });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // Erro de unique constraint
         res.status(409).json({ message: "Já existe uma regra similar." });
    }
     else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};

/**
 * @route    PATCH /rbac-rules/:id
 * @desc     Atualiza uma regra RBAC (agora valida systemId/perfis)
 * @access   Private
 */
const updateRbacRule = async (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) {
    return res.status(400).json({ message: "ID de regra inválido." });
  }

  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }

  try {
       // 1. Validar e preparar dados (agora é async e valida systemId/perfis)
       const validatedData = await validateAndPrepareRbacData(req.body, true);

       // 2. Usar transação
       const updatedRule = await prisma.$transaction(async (tx) => {
         // Verifica se a regra existe e pertence ao usuário
         const existingRule = await tx.rbacRule.findFirst({
             where: { id: ruleId, userId: userIdInt }
         });
         if (!existingRule) {
             throw new Error("Regra não encontrada ou não pertence a este usuário.");
         }
         
         // Segurança: Verifica se o systemId está sendo alterado (não deveria ser permitido por PATCH)
         if (validatedData.systemId !== existingRule.systemId) {
             throw new Error("Não é permitido alterar o Sistema de uma regra RBAC existente.");
         }

         // Deleta condições antigas
         await tx.rbacAttributeCondition.deleteMany({
           where: { rbacRuleId: ruleId }
         });

         // Atualiza a regra principal
         const rule = await tx.rbacRule.update({
             where: { id: ruleId },
             data: {
                 ...validatedData,
                 // userId não é atualizado, systemId é validado acima
             },
         });

         // Recria condições (se Múltiplos Atributos)
         if (validatedData.conditionType === "BY_MULTIPLE_ATTRIBUTES") {
              if (!Array.isArray(req.body.attributeConditions)) {
                 throw new Error("Formato inválido para attributeConditions.");
              }
             const conditionsToCreate = req.body.attributeConditions.map(cond => {
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
                     operator: cond.operator,
                     attributeValue: String(cond.value),
                 };
             });
              if (conditionsToCreate.length > 0) {
                  await tx.rbacAttributeCondition.createMany({
                      data: conditionsToCreate,
                  });
              }
         }
         return rule;
     });

      // Busca a regra completa atualizada
      const completeUpdatedRule = await prisma.rbacRule.findUnique({
        where: { id: updatedRule.id },
        include: {
            system: { select: { id: true, name: true } }, // <<< INCLUÍDO
            grantedProfile: { select: { id: true, name: true } },
            requiredProfile: { select: { id: true, name: true } },
            attributeConditions: true,
        },
    });

    if (!completeUpdatedRule) {
        throw new Error("Falha ao buscar a regra atualizada.");
    }

    res.status(200).json(completeUpdatedRule);

  } catch (error) {
    console.error("Erro ao atualizar regra RBAC:", error);
     if (error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("desconhecido") || error.message.includes("Regra não encontrada") || error.message.includes("iguais") || error.message.includes("Condição inválida") || error.message.includes("não encontrado ou não pertence") || error.message.includes("Não é permitido alterar")) {
        res.status(400).json({ message: error.message });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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

   const userIdInt = parseInt(req.user.id, 10);
   if (isNaN(userIdInt)) {
       return res.status(400).json({ message: "ID de usuário inválido." });
   }

  try {
       const deleteResult = await prisma.rbacRule.deleteMany({
        where: {
          id: ruleId,
          userId: userIdInt,
        },
      });

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Regra RBAC não encontrada ou não pertence a este usuário." });
    }

    res.status(204).send(); // Sucesso, sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar regra RBAC:", error);
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