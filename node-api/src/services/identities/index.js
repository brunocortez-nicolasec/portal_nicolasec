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
    // A remoção do filtro 'not RH' pode ser feita aqui se a visão geral precisar incluir RH.
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
    // --- RE-ADICIONANDO CORREÇÃO: Incluir ID do Perfil ---
    const identities = await prisma.identity.findMany({
      where: whereClause,
      include: {
        profile: {
          select: {
            id: true,   // <<< Re-adicionado para retornar o ID do perfil
            name: true,
          },
        },
      },
      // --- FIM DA CORREÇÃO ---
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(identities);
  } catch (error) {
    console.error("Erro ao buscar identidades:", error);
    return res.status(500).json({ message: "Erro interno do servidor ao buscar identidades." });
  }
};

// --- INÍCIO DA ADIÇÃO: Função DELETE ---
/**
 * @route   DELETE /identities?sourceSystem=NOMEDOSISTEMA
 * @desc    Deleta TODAS as identidades de um sistema específico (incluindo RH).
 * @access  Private
 */
const deleteIdentitiesBySystem = async (req, res) => {
    // 1. Extrai o sourceSystem da query string
    const { sourceSystem } = req.query;

    // 2. Validação básica
    if (!sourceSystem) {
        return res.status(400).json({ message: "Parâmetro 'sourceSystem' é obrigatório." });
    }

    // 3. (REMOVIDO) Proteção contra limpeza do RH foi removida conforme solicitado.

    try {
        // 4. Executa a exclusão em massa
        const deleteResult = await prisma.identity.deleteMany({
            where: {
                // Filtra pelo sourceSystem (case-insensitive)
                sourceSystem: { equals: sourceSystem, mode: 'insensitive' }
            }
        });

        console.log(`Identidades deletadas para ${sourceSystem}: ${deleteResult.count}`);

        // 5. Retorna sucesso
        return res.status(200).json({ message: `${deleteResult.count} identidades do sistema "${sourceSystem}" foram excluídas.` });
        // Alternativa: return res.status(204).send();

    } catch (error) {
        // 6. Tratamento de erro
        console.error(`Erro ao deletar identidades para o sistema ${sourceSystem}:`, error);
        // Verificar se é um erro específico do Prisma (ex: P2025 - Registro não encontrado para deletar, embora deleteMany não deva dar esse erro)
        return res.status(500).json({ message: "Erro interno do servidor ao limpar identidades." });
    }
};
// --- FIM DA ADIÇÃO ---


// --- Definição das Rotas ---
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getIdentities
);

// --- INÍCIO DA ADIÇÃO: Rota DELETE ---
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }), // Protege a rota
  deleteIdentitiesBySystem // Associa a função à rota
);
// --- FIM DA ADIÇÃO ---

export default router;