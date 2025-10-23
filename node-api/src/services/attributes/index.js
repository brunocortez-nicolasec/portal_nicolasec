// node-api/src/services/attributes/index.js

import express from "express";
import passport from "passport";

const router = express.Router();

// Lista pré-definida de atributos da Identity que podem ser usados em regras
// (Excluindo id, extraData, createdAt, updatedAt, profileId, profile)
const availableAttributes = [
  { id: "sourceSystem", name: "Sistema de Origem" },
  { id: "identityId", name: "ID da Identidade (Matrícula/Login)" },
  { id: "name", name: "Nome" },
  { id: "email", name: "Email" },
  { id: "status", name: "Status" },
  { id: "userType", name: "Tipo de Usuário" },
  { id: "cpf", name: "CPF" },
];

/**
 * @route   GET /identity-attributes
 * @desc    Retorna a lista de atributos da Identity disponíveis para regras
 * @access  Private
 */
const getIdentityAttributes = async (req, res) => {
  try {
    // Simplesmente retorna a lista pré-definida
    res.status(200).json(availableAttributes);
  } catch (error) {
    console.error("Erro ao buscar atributos da Identity:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição da Rota ---
// A rota base será definida no index.js principal como "/identity-attributes"
router.get("/", passport.authenticate("jwt", { session: false }), getIdentityAttributes);

export default router;