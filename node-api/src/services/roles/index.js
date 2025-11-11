import express from "express";
import passport from "passport";
import { PrismaClient, Prisma } from "@prisma/client"; // Importar Prisma

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /roles (ou /resources)
 * @desc    Busca Recursos (antigos Perfis), opcionalmente filtrados por systemId.
 * @access  Private
 * @query   ?systemId=<ID> (Opcional) Filtra recursos por ID do sistema (Fluxo 3).
 */
const getResources = async (req, res) => {
  const { systemId } = req.query;
  const whereClause = {};

  // Adiciona filtro se systemId for fornecido
  if (systemId) {
    const systemIdInt = parseInt(systemId, 10);
    if (!isNaN(systemIdInt)) {
      // Filtra Recursos (Resource) que têm 'algum' relacionamento
      // na tabela System_Resource onde o systemId bate.
      whereClause.systems = {
        some: {
          systemId: systemIdInt,
        },
      };
    } else {
      return res.status(400).json({ message: "systemId inválido." });
    }
  }

  try {
    const resources = await prisma.resource.findMany({
      where: whereClause,
      orderBy: { name_resource: "asc" },
      select: {
        id: true,
        name_resource: true,
        description_resource: true,
        // Inclui os sistemas relacionados (para saber onde é usado)
        systems: {
          select: {
            system: {
              select: {
                id: true,
                dataSource: { // Busca o nome da fonte de dados principal
                  select: { name_datasource: true }
                }
              }
            }
          }
        }
      },
    });

    // Formata a resposta para ser mais limpa (opcional, mas recomendado)
    const formattedResources = resources.map(r => ({
      id: r.id,
      name: r.name_resource,
      description: r.description_resource,
      // Simplifica a lista de sistemas
      systems: r.systems.map(s => ({
        id: s.system.id,
        name: s.system.dataSource?.name_datasource || 'Nome não encontrado'
      }))
    }));

    res.status(200).json(formattedResources);
  } catch (error) {
    console.error("Erro ao buscar Recursos:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   POST /roles (ou /resources)
 * @desc    Cria um novo Recurso E o associa a um Sistema.
 * @access  Private
 * @body    { name: string, systemId: number }
 */
const createResource = async (req, res) => {
  const { name, systemId } = req.body;

  // Validação
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Nome do Recurso é obrigatório." });
  }
  if (systemId === null || systemId === undefined || isNaN(parseInt(systemId, 10))) {
    return res.status(400).json({ message: "ID do Sistema (systemId) é obrigatório." });
  }
  const systemIdInt = parseInt(systemId, 10);

  try {
    // 1. Verifica se o Sistema (Fluxo 3) existe
    const systemExists = await prisma.system.findUnique({ where: { id: systemIdInt } });
    if (!systemExists) {
      return res.status(404).json({ message: `Sistema (Fluxo 3) com ID ${systemIdInt} não encontrado.` });
    }

    // 2. Cria o Recurso e a Relação em uma transação
    const newResource = await prisma.$transaction(async (tx) => {
      // Primeiro, cria o recurso
      const resource = await tx.resource.create({
        data: {
          name_resource: name.trim(),
        },
      });

      // Em seguida, associa ao sistema
      await tx.system_Resource.create({
        data: {
          systemId: systemIdInt,
          resourceId: resource.id,
        },
      });

      return resource;
    });

    res.status(201).json(newResource); // Retorna o recurso criado

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: `Recurso com nome "${name}" já pode existir ou a relação já foi criada.` });
    }
    console.error("Erro ao criar Recurso:", error);
    res.status(500).json({ message: "Erro interno do servidor ao criar Recurso." });
  }
};

/**
 * @route   PATCH /roles/:id (ou /resources/:id)
 * @desc    Atualiza o nome de um Recurso.
 * @access  Private
 * @param   id (ID do Recurso)
 * @body    { name: string }
 */
const updateResource = async (req, res) => {
  const resourceId = parseInt(req.params.id, 10);
  const { name } = req.body;

  if (isNaN(resourceId)) {
    return res.status(400).json({ message: "ID de Recurso inválido." });
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Novo nome do Recurso é obrigatório." });
  }

  try {
    const updatedResource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        name_resource: name.trim(),
      },
    });
    res.status(200).json(updatedResource);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: `Recurso com nome "${name}" já existe.` });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return res.status(404).json({ message: "Recurso não encontrado." });
    }
    console.error(`Erro ao atualizar Recurso #${resourceId}:`, error);
    res.status(500).json({ message: "Erro interno do servidor ao atualizar Recurso." });
  }
};

/**
 * @route   DELETE /roles/:id (ou /resources/:id)
 * @desc    Deleta um Recurso.
 * @access  Private
 * @param   id (ID do Recurso)
 */
const deleteResource = async (req, res) => {
  const resourceId = parseInt(req.params.id, 10);

  if (isNaN(resourceId)) {
    return res.status(400).json({ message: "ID de Recurso inválido." });
  }

  try {
    const deleteResult = await prisma.resource.deleteMany({
      where: { id: resourceId }
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Recurso não encontrado." });
    }

    res.status(204).send(); // Sucesso, sem conteúdo

  } catch (error) {
    // P2003: Foreign key constraint failed
    // Se Account_Resource ou System_Resource ainda referencia este Recurso
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(409).json({ message: "Não é possível excluir este Recurso pois ele está sendo referenciado (em contas ou sistemas)." });
    }
    console.error(`Erro ao deletar Recurso #${resourceId}:`, error);
    res.status(500).json({ message: "Erro interno do servidor ao deletar Recurso." });
  }
};

// --- Definição das Rotas ---
// (Você pode querer mudar o 'passaport.authenticate' para um 'isAdmin' se for o caso)
router.get("/", passport.authenticate("jwt", { session: false }), getResources);
router.post("/", passport.authenticate("jwt", { session: false }), createResource); 
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateResource);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteResource);

export default router;