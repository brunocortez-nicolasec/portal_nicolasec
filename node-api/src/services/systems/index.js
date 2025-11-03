import express from "express";
import passport from "passport";
// Adiciona Prisma para tratamento de erro
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Helper: Pega o objeto do formulário e o "empacota" para o banco de dados.
 */
const packSystemData = (body) => {
  const { name, description, databaseType } = body;
  
  const connectionDetails = { ...body };
  // Limpa o JSON de detalhes removendo os campos que são colunas principais
  delete connectionDetails.name;
  delete connectionDetails.description;
  delete connectionDetails.databaseType;
  delete connectionDetails.id;
  delete connectionDetails.createdAt;
  delete connectionDetails.updatedAt;
  delete connectionDetails.userId;
  delete connectionDetails.type; // Remove 'type' se ele veio do front-end

  return {
    name,
    description,
    type: databaseType, // O tipo da fonte de dados (ex: "Oracle")
    connectionDetails, // O resto (username, port, serverName, etc.) vira JSON
  };
};

/**
 * Helper: Pega os dados do banco e os "desempacota" para o modal do front-end.
 */
const unpackSystemData = (system) => {
  // Se 'profiles' não foi incluído, a variável será undefined e não afetará o spread
  const { connectionDetails, type, ...restOfSystem } = system;
  return {
    ...restOfSystem,      // id, name, description, createdAt, profiles (se incluído), etc.
    type: type,           // Mantém 'type' para a tabela
    databaseType: type, // Adiciona 'databaseType' para o modal
    ...(connectionDetails || {}), // "Desempacota" os campos do JSON (username, port, etc.)
  };
};

/**
 * Helper: Valida os dados da fonte de dados com base no tipo
 */
const validateDataSource = (data) => {
  const { name, databaseType } = data;
  if (!name) return "O nome da fonte de dados é obrigatório.";
  if (!databaseType) return "O tipo da fonte de dados é obrigatório.";

  // Validação de campos obrigatórios por tipo
  switch (databaseType) {
    case "PostgreSQL":
      if (!data.username || !data.serverName || !data.port || !data.database) {
        return "Para PostgreSQL, todos os campos (Username, Server Name, Port, Database) são obrigatórios.";
      }
      break;
    case "Oracle":
      if (!data.username || !data.serverName || !data.port || !data.serviceName) {
        return "Para Oracle, todos os campos (Username, Server Name, Port, Service Name/SID) são obrigatórios.";
      }
      break;
    case "Microsoft SQL Server":
      if (!data.username || !data.serverName || !data.port || !data.database) {
        return "Para SQL Server, todos os campos (Username, Server Name, Port, Database) são obrigatórios.";
      }
      break;
    case "Other":
      if (!data.jdbcUrl) {
        return "Para o tipo 'Other', a JDBC URL é obrigatória.";
      }
      break;
    case "CSV":
      // CSV só precisa de um nome, que já foi validado.
      break;
    default:
      return "Tipo de fonte de dados desconhecido.";
  }
  return null; // Sem erros
};


/**
 * @route   GET /systems
 * @desc    Busca todos os sistemas (fontes de dados) e os "desempacota"
 * @access  Private
 * @query   ?includeProfiles=true (Opcional) Inclui perfis associados
 */
const getSystems = async (req, res) => {
  // --- INÍCIO DA MODIFICAÇÃO: Garantir userId Int e adicionar 'include' opcional ---
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }

  const { includeProfiles } = req.query;
  const includeClause = {};

  // Se o frontend pedir, inclui os perfis associados ao sistema
  if (includeProfiles === 'true') {
      includeClause.profiles = {
          select: {
              id: true,
              name: true
          }
      };
  }
  // --- FIM DA MODIFICAÇÃO ---

  try {
    const systemsFromDb = await prisma.system.findMany({
      where: { userId: userIdInt }, // Usa Int
      orderBy: { createdAt: 'desc' },
      include: includeClause, // <<< ADICIONADO includeClause
    });
    // O unpackSystemData já lida com a inclusão opcional de 'profiles'
    const systems = systemsFromDb.map(unpackSystemData);
    res.status(200).json(systems);
  } catch (error) {
    console.error("Erro ao buscar sistemas:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   POST /systems
 * @desc    Cria um novo sistema (fonte de dados)
 * @access  Private
 */
const createSystem = async (req, res) => {
  const validationError = validateDataSource(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const { name } = req.body;
  
  // --- INÍCIO DA MODIFICAÇÃO: Garantir userId Int ---
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }
  // --- FIM DA MODIFICAÇÃO ---

  try {
    const existingSystem = await prisma.system.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, userId: userIdInt }, // Usa Int
    });

    if (existingSystem) {
      return res.status(409).json({ message: `A fonte de dados "${name}" já existe.` });
    }

    const dataToSave = packSystemData(req.body);

    const newSystem = await prisma.system.create({
      data: {
        ...dataToSave,
        userId: userIdInt, // Usa Int
      },
    });
    res.status(201).json(unpackSystemData(newSystem));
  } catch (error) {
    console.error("Erro ao criar sistema:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @route   PATCH /systems/:id
 * @desc    Atualiza um sistema (fonte de dados)
 * @access  Private
 */
const updateSystem = async (req, res) => {
  const systemId = parseInt(req.params.id, 10);
  if (isNaN(systemId)) {
    return res.status(400).json({ message: "ID de sistema inválido." });
  }

  const validationError = validateDataSource(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const { name } = req.body;

  // --- INÍCIO DA MODIFICAÇÃO: Garantir userId Int ---
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }
  // --- FIM DA MODIFICAÇÃO ---

  try {
    const system = await prisma.system.findFirst({
      where: { id: systemId, userId: userIdInt }, // Usa Int
    });

    if (!system) {
      return res.status(404).json({ message: "Fonte de dados não encontrada." });
    }

    const existingSystemWithNewName = await prisma.system.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        userId: userIdInt, // Usa Int
        id: { not: systemId },
      },
    });

    if (existingSystemWithNewName) {
      return res.status(409).json({ message: `O nome "${name}" já está em uso.` });
    }

    const dataToSave = packSystemData(req.body);

    const updatedSystem = await prisma.system.update({
      where: { id: systemId },
      data: dataToSave,
    });

    res.status(200).json(unpackSystemData(updatedSystem));
  } catch (error) {
    console.error("Erro ao atualizar sistema:", error);
    // --- INÍCIO DA MODIFICAÇÃO: Tratar erro P2002 (Nome duplicado) ---
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Pode acontecer se a verificação acima falhar por condição de corrida
         return res.status(409).json({ message: `O nome "${name}" já está em uso.` });
    }
    // --- FIM DA MODIFICAÇÃO ---
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


/**
 * @route   DELETE /systems/:id
 * @desc    Deleta um sistema específico do usuário logado
 * @access  Private
 */
const deleteSystem = async (req, res) => {
  const systemId = parseInt(req.params.id, 10);
  if (isNaN(systemId)) {
    return res.status(400).json({ message: "ID de sistema inválido." });
  }

  // --- INÍCIO DA MODIFICAÇÃO: Garantir userId Int ---
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }
  // --- FIM DA MODIFICAÇÃO ---
  
  try {
    // Busca e verifica posse antes de deletar
    const system = await prisma.system.findFirst({
      where: { id: systemId, userId: userIdInt }, // Usa Int
    });

    if (!system) {
      return res.status(404).json({ message: "Sistema não encontrado ou não pertence a este usuário." });
    }

    // Tenta deletar. O cascade delete deve lidar com Accounts, Profiles, RbacRules, SodRules.
    await prisma.system.delete({
      where: { id: systemId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar sistema:", error);
    // --- INÍCIO DA MODIFICAÇÃO: Tratar erro P2003 (FK Constraint) ---
    // Caso o onDelete: Cascade falhe ou algo mais referencie o sistema
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
         return res.status(409).json({ message: "Não é possível excluir este sistema pois ele ainda está sendo referenciado." });
    }
    // --- FIM DA MODIFICAÇÃO ---
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};


// Definindo as rotas
router.get("/", passport.authenticate("jwt", { session: false }), getSystems);
router.post("/", passport.authenticate("jwt", { session: false }), createSystem);
router.patch("/:id", passport.authenticate("jwt", { session: false }), updateSystem);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteSystem);

export default router;