// node-api/src/services/credentials/index.js

import express from "express";
import passport from "passport";
import axios from "axios";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware de verificação de Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
};

// Função para obter o token temporário do Conjur
async function getConjurToken() {
  const conjurUrl = process.env.CONJUR_URL;
  const account = process.env.CONJUR_ACCOUNT;
  const loginId = encodeURIComponent(process.env.CONJUR_LOGIN_ID);
  const apiKey = process.env.CONJUR_API_KEY;

  const authUrl = `${conjurUrl}/authn/${account}/${loginId}/authenticate`;

  // O Conjur pode exigir a desativação da verificação SSL se usar certificados autoassinados
  // const https = require('https');
  // const agent = new https.Agent({ rejectUnauthorized: false });

  const response = await axios.post(authUrl, apiKey, {
    headers: { 'Content-Type': 'text/plain' },
    // httpsAgent: agent // Descomente se precisar de SSL não verificado
  });

  return response.data; // Retorna o token temporário
}

// Rota POST / para criar uma nova credencial
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, credential, value } = req.body;
      
      // 1. Obter o token temporário do Conjur
      const conjurToken = await getConjurToken();

      // 2. Definir o caminho do segredo no Conjur (ex: secrets/aws/api_key)
      const secretPath = `${process.env.CONJUR_ACCOUNT}:variable:secrets/${name}/${credential}`;

      // 3. Usar o token para salvar o segredo no Conjur
      await axios.post(
        `${process.env.CONJUR_URL}/secrets/${encodeURIComponent(secretPath)}`,
        value,
        {
          headers: {
            'Authorization': `Token token="${conjurToken}"`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      // 4. Salvar a REFERÊNCIA no nosso banco de dados (sem salvar o valor!)
      await prisma.credential.create({
          data: {
              name: name,
              path: `secrets/${name}/${credential}`, // Salva o caminho para referência futura
          }
      })

      res.status(200).json({ message: "Credencial salva com sucesso no Conjur." });

    } catch (error) {
      console.error("Erro ao salvar no Conjur:", error.response?.data || error.message);
      res.status(500).json({ message: "Falha ao comunicar com o Conjur." });
    }
  }
);

export default router;