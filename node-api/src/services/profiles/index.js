import express from "express";
import passport from "passport";
import { PrismaClient, Prisma } from "@prisma/client"; // Importar Prisma

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /profiles
 * @desc    Busca perfis, opcionalmente filtrados por systemId. Inclui info do sistema.
 * @access  Private
 * @query   ?systemId=<ID> (Opcional) Filtra perfis por ID do sistema.
 */
const getProfiles = async (req, res) => {
  // Pega systemId da query string, se existir
  const { systemId } = req.query;
  const whereClause = {};

  // Adiciona filtro se systemId for fornecido e for um número válido
  if (systemId) {
    const systemIdInt = parseInt(systemId, 10);
    if (!isNaN(systemIdInt)) {
      whereClause.systemId = systemIdInt;
    } else {
      return res.status(400).json({ message: "systemId inválido." });
    }
  }
  // Se nenhum systemId for fornecido, busca todos os perfis.

  try {
    const profiles = await prisma.profile.findMany({
      where: whereClause, // Aplica o filtro (ou objeto vazio se não houver filtro)
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        systemId: true, // <<< Inclui systemId
        system: {      // <<< Inclui nome do sistema relacionado
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
    res.status(200).json(profiles);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- NOVAS ROTAS CRUD ---

/**
 * @route   POST /profiles
 * @desc    Cria um novo perfil associado a um sistema.
 * @access  Private
 * @body    { name: string, systemId: number }
 */
const createProfile = async (req, res) => {
    const { name, systemId } = req.body;

    // Validação básica
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Nome do perfil é obrigatório." });
    }
    if (systemId === null || systemId === undefined || isNaN(parseInt(systemId, 10))) {
         return res.status(400).json({ message: "ID do Sistema (systemId) é obrigatório e deve ser um número." });
    }
    const systemIdInt = parseInt(systemId, 10);

    try {
        // Verifica se o sistema existe (opcional, mas bom)
        const systemExists = await prisma.system.findUnique({ where: { id: systemIdInt } });
        if (!systemExists) {
            return res.status(404).json({ message: `Sistema com ID ${systemIdInt} não encontrado.` });
        }

        const newProfile = await prisma.profile.create({
            data: {
                name: name.trim(),
                systemId: systemIdInt, // Associa ao sistema
            },
            // Retorna o perfil criado com info do sistema
             select: {
                id: true, name: true, systemId: true,
                system: { select: { id: true, name: true } }
            }
        });
        res.status(201).json(newProfile);

    } catch (error) {
        // Trata erro de constraint unique (nome + systemId)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             // Assumindo que a constraint @@unique([systemId, name]) está ativa
             return res.status(409).json({ message: `Perfil com nome "${name}" já existe neste sistema.` });
         }
        console.error("Erro ao criar perfil:", error);
        res.status(500).json({ message: "Erro interno do servidor ao criar perfil." });
    }
};

/**
 * @route   PATCH /profiles/:id
 * @desc    Atualiza o nome de um perfil.
 * @access  Private
 * @param   id (ID do Perfil)
 * @body    { name: string }
 */
const updateProfile = async (req, res) => {
    const profileId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(profileId)) {
        return res.status(400).json({ message: "ID de perfil inválido." });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Novo nome do perfil é obrigatório." });
    }

    try {
         // Busca o perfil para garantir que existe e pegar o systemId (para verificar unicidade do novo nome)
         const existingProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { systemId: true } // Seleciona apenas o systemId
         });

         if (!existingProfile) {
             return res.status(404).json({ message: "Perfil não encontrado." });
         }

        const updatedProfile = await prisma.profile.update({
            where: { id: profileId },
            data: {
                name: name.trim(),
                // Não permite mudar systemId por PATCH, idealmente
            },
            select: { // Retorna dados atualizados
                id: true, name: true, systemId: true,
                system: { select: { id: true, name: true } }
            }
        });
        res.status(200).json(updatedProfile);

    } catch (error) {
       // Trata erro de constraint unique (nome + systemId)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             // Assumindo que a constraint @@unique([systemId, name]) está ativa
             return res.status(409).json({ message: `Perfil com nome "${name}" já existe neste sistema.` });
         }
        console.error(`Erro ao atualizar perfil #${profileId}:`, error);
        res.status(500).json({ message: "Erro interno do servidor ao atualizar perfil." });
    }
};

/**
 * @route   DELETE /profiles/:id
 * @desc    Deleta um perfil.
 * @access  Private
 * @param   id (ID do Perfil)
 */
const deleteProfile = async (req, res) => {
    const profileId = parseInt(req.params.id, 10);

    if (isNaN(profileId)) {
        return res.status(400).json({ message: "ID de perfil inválido." });
    }

    try {
        // Usa deleteMany para não dar erro se não encontrar
        const deleteResult = await prisma.profile.deleteMany({
            where: { id: profileId }
        });

        if (deleteResult.count === 0) {
            return res.status(404).json({ message: "Perfil não encontrado." });
        }

        res.status(204).send(); // Sucesso, sem conteúdo

    } catch (error) {
         // Trata erro de constraint (P2003: Foreign key constraint failed)
         // Se alguma AccountProfile ou RbacRule ainda referencia este perfil
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             return res.status(409).json({ message: "Não é possível excluir este perfil pois ele está sendo referenciado (em contas ou regras RBAC)." });
         }
        console.error(`Erro ao deletar perfil #${profileId}:`, error);
        res.status(500).json({ message: "Erro interno do servidor ao deletar perfil." });
    }
};

// --- FIM DAS NOVAS ROTAS ---


// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getProfiles);
router.post("/", passport.authenticate("jwt", { session: false }), createProfile); // <<< Adicionado
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateProfile); // <<< Adicionado
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteProfile); // <<< Adicionado

export default router;