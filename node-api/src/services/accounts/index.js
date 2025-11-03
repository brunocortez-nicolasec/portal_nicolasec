import express from "express";
import passport from "passport";
import { PrismaClient, Prisma } from "@prisma/client"; // Importar Prisma

const prisma = new PrismaClient();
const router = express.Router();

// --- Constantes ---
const validComparisonOperators = [
  "equals", "not_equals", "contains", "starts_with", "ends_with"
];

// --- Funções Auxiliares ---
const formatAccountProfiles = (account) => {
    if (account && account.profiles) {
        const profileList = account.profiles.map(ap => ap.profile).filter(p => !!p);
        return { ...account, profiles: profileList };
    }
    return account;
};

// --- Funções de Rota ---

/**
 * @route   GET /accounts
 * @desc    Busca contas, opcionalmente filtradas.
 * @access  Private
 */
const getAccounts = async (req, res) => {
    const { identityId, systemId, includeProfiles } = req.query;
    const whereClause = {};

    if (identityId) {
        const identityIdInt = parseInt(identityId, 10);
        if (!isNaN(identityIdInt)) {
            whereClause.identityId = identityIdInt;
        } else {
            return res.status(400).json({ message: "Parâmetro 'identityId' inválido." });
        }
    }

    if (systemId) {
        const systemIdInt = parseInt(systemId, 10);
        if (!isNaN(systemIdInt)) {
            whereClause.systemId = systemIdInt;
        } else {
            return res.status(400).json({ message: "Parâmetro 'systemId' inválido." });
        }
    }

    const includeClause = {
        identity: { select: { id: true, name: true, email: true, cpf: true } },
        system: { select: { id: true, name: true, type: true } }
    };

    if (includeProfiles === 'true') {
        includeClause.profiles = {
            include: {
                profile: { select: { id: true, name: true } }
            }
        };
    }

    try {
        const accounts = await prisma.account.findMany({
            where: whereClause,
            include: includeClause,
            orderBy: [
                { system: { name: 'asc' } },
                { accountIdInSystem: 'asc' }
            ]
        });

        const formattedAccounts = accounts.map(formatAccountProfiles);
        return res.status(200).json(formattedAccounts);

    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        return res.status(500).json({ message: "Erro interno do servidor ao buscar contas." });
    }
};

/**
 * @route   GET /accounts/:id
 * @desc    Busca uma conta específica pelo seu ID.
 * @access  Private
 */
const getAccountById = async (req, res) => {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
        return res.status(400).json({ message: "ID de conta inválido." });
    }

    try {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            include: {
                identity: { select: { id: true, name: true, email: true, cpf: true } },
                system: { select: { id: true, name: true, type: true } },
                profiles: { include: { profile: { select: { id: true, name: true } } } }
            }
        });

        if (!account) {
            return res.status(404).json({ message: "Conta não encontrada." });
        }

        const formattedAccount = formatAccountProfiles(account);
        return res.status(200).json(formattedAccount);

    } catch (error) {
        console.error(`Erro ao buscar conta #${accountId}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
};

/**
 * @route   PATCH /accounts/:id
 * @desc    Atualiza dados de uma conta.
 * @access  Private
 */
const updateAccount = async (req, res) => {
    const accountId = parseInt(req.params.id, 10);
    const { name, email, status, userType, extraData, profileIds } = req.body;

    if (isNaN(accountId)) {
        return res.status(400).json({ message: "ID de conta inválido." });
    }

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (status !== undefined) dataToUpdate.status = status;
    if (userType !== undefined) dataToUpdate.userType = userType;
    if (extraData !== undefined) dataToUpdate.extraData = extraData;

    if (Object.keys(dataToUpdate).length === 0 && profileIds === undefined) {
         return res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
    }

     if (profileIds !== undefined && !Array.isArray(profileIds)) {
         return res.status(400).json({ message: "profileIds deve ser um array de números." });
     }
     const profileIdsInt = profileIds?.map(id => parseInt(id, 10)).filter(id => !isNaN(id));


    try {
        const updatedAccount = await prisma.$transaction(async (tx) => {
            let account;
            if (Object.keys(dataToUpdate).length > 0) {
                 account = await tx.account.update({
                    where: { id: accountId },
                    data: dataToUpdate,
                });
             } else {
                 account = await tx.account.findUnique({ where: { id: accountId } });
             }

            if (!account) {
                 throw new Error("Conta não encontrada.");
             }

            if (profileIdsInt !== undefined) {
                await tx.accountProfile.deleteMany({
                    where: { accountId: accountId }
                });

                if (profileIdsInt.length > 0) {
                    const newProfileLinks = profileIdsInt.map(pId => ({
                        accountId: accountId,
                        profileId: pId,
                    }));
                    await tx.accountProfile.createMany({
                        data: newProfileLinks,
                        skipDuplicates: true
                    });
                }
            }

            return await tx.account.findUnique({
                 where: { id: accountId },
                 include: {
                     identity: { select: { id: true, name: true, email: true, cpf: true } },
                     system: { select: { id: true, name: true, type: true } },
                     profiles: { include: { profile: { select: { id: true, name: true } } } }
                 }
             });
        });

        if (!updatedAccount) {
           return res.status(404).json({ message: "Conta não encontrada após atualização." });
        }

        const formattedAccount = formatAccountProfiles(updatedAccount);
        return res.status(200).json(formattedAccount);

    } catch (error) {
        console.error(`Erro ao atualizar conta #${accountId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              return res.status(409).json({ message: `Erro de unicidade: ${error.meta?.target}` });
         }
         if (error.message === "Conta não encontrada.") {
             return res.status(404).json({ message: error.message });
         }
        return res.status(500).json({ message: "Erro interno do servidor ao atualizar conta." });
    }
};

/**
 * @route   DELETE /accounts/:id
 * @desc    Deleta uma conta específica pelo seu ID.
 * @access  Private
 */
const deleteAccount = async (req, res) => {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
        return res.status(400).json({ message: "ID de conta inválido." });
    }

    try {
        const deleteResult = await prisma.account.deleteMany({
            where: { id: accountId }
        });

        if (deleteResult.count === 0) {
            return res.status(404).json({ message: "Conta não encontrada." });
        }

        return res.status(204).send();

    } catch (error) {
        console.error(`Erro ao deletar conta #${accountId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return res.status(409).json({ message: "Não é possível excluir esta conta pois ela está sendo referenciada em outro lugar." });
        }
        return res.status(500).json({ message: "Erro interno do servidor ao deletar conta." });
    }
};


// --- INÍCIO DA ADIÇÃO: Rota DELETE em massa por systemId ---
/**
 * @route   DELETE /accounts
 * @desc    Deleta TODAS as contas de um sistema específico.
 * @access  Private
 * @query   ?systemId=<ID> (Obrigatório)
 */
const deleteAccountsBySystem = async (req, res) => {
    const { systemId } = req.query;
    const systemIdInt = parseInt(systemId, 10);

    if (isNaN(systemIdInt)) {
        return res.status(400).json({ message: "Parâmetro 'systemId' é obrigatório e deve ser um número." });
    }
    
    // Opcional: Verificar se o sistema é 'RH' (pelo ID) se houver um ID fixo para o RH na tabela System
    // const rhSystem = await prisma.system.findUnique({ where: { name: 'RH' }});
    // if (rhSystem && systemIdInt === rhSystem.id) {
    //    return res.status(403).json({ message: "Contas do RH (Identidades) não podem ser limpas por esta rota." });
    // }

    try {
        // Deleta todas as contas associadas ao systemId
        // O cascade delete no schema deve cuidar de AccountProfile
        const deleteResult = await prisma.account.deleteMany({
            where: {
                systemId: systemIdInt
            }
        });

        console.log(`Contas deletadas para systemId ${systemIdInt}: ${deleteResult.count}`);

        return res.status(200).json({ message: `${deleteResult.count} contas do sistema foram excluídas.` });

    } catch (error) {
        console.error(`Erro ao deletar contas para o sistema ${systemIdInt}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor ao limpar contas." });
    }
};
// --- FIM DA ADIÇÃO ---


// --- Definição das Rotas ---
router.get( "/", passport.authenticate("jwt", { session: false }), getAccounts );
router.delete( "/", passport.authenticate("jwt", { session: false }), deleteAccountsBySystem ); // <<< ROTA ADICIONADA
router.get( "/:id", passport.authenticate("jwt", { session: false }), getAccountById );
router.patch( "/:id", passport.authenticate("jwt", { session: false }), updateAccount );
router.delete( "/:id", passport.authenticate("jwt", { session: false }), deleteAccount );


export default router;