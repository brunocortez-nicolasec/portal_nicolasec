import express from "express";
import passport from "passport";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Busca e filtra as identidades com base nos parâmetros da query.
 * Ex: GET /identities?sourceSystem=TruIM&userType=Funcionário
 */
const getIdentities = async (req, res) => {
  const { sourceSystem, userType, status } = req.query;
  const whereClause = {};

  if (sourceSystem) {
    whereClause.sourceSystem = { equals: sourceSystem, mode: 'insensitive' };
  } else {
    // Se a visão geral NÃO deve incluir RH, mantenha como está.
    whereClause.sourceSystem = { not: 'RH' };
  }

  if (userType) {
    if (userType === 'Não categorizado') {
      whereClause.OR = [ { userType: null }, { userType: '' } ];
    } else {
      whereClause.userType = userType;
    }
  }

  if (status) {
    whereClause.status = status;
  }

  try {
    // --- INÍCIO DA MODIFICAÇÃO: Remover 'include' de profile ---
    const identities = await prisma.identity.findMany({
      where: whereClause,
      // REMOVIDO: include: { profile: { select: { id: true, name: true } } }
      // Agora busca apenas os dados da própria Identity
      orderBy: {
        createdAt: 'desc',
      },
    });
    // --- FIM DA MODIFICAÇÃO ---

    return res.status(200).json(identities);
  } catch (error) {
    console.error("Erro ao buscar identidades:", error);
    return res.status(500).json({ message: "Erro interno do servidor ao buscar identidades." });
  }
};

/**
 * @route   DELETE /identities?sourceSystem=NOMEDOSISTEMA
 * @desc    Deleta TODAS as identidades de um sistema específico (incluindo RH).
 * @access  Private
 */
const deleteIdentitiesBySystem = async (req, res) => {
    const { sourceSystem } = req.query;

    if (!sourceSystem) {
        return res.status(400).json({ message: "Parâmetro 'sourceSystem' é obrigatório." });
    }

    try {
        const deleteResult = await prisma.identity.deleteMany({
            where: {
                sourceSystem: { equals: sourceSystem, mode: 'insensitive' }
            }
        });

        console.log(`Identidades deletadas para ${sourceSystem}: ${deleteResult.count}`);
        return res.status(200).json({ message: `${deleteResult.count} identidades do sistema "${sourceSystem}" foram excluídas.` });

    } catch (error) {
        console.error(`Erro ao deletar identidades para o sistema ${sourceSystem}:`, error);
        return res.status(500).json({ message: "Erro interno do servidor ao limpar identidades." });
    }
};

// --- Definição das Rotas ---
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getIdentities
);

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  deleteIdentitiesBySystem
);

export default router;