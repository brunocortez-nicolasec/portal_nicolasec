import express from "express";
import passport from "passport";
import axios from "axios";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware para garantir que apenas Admins possam acessar
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
};

// --- FUNÇÕES DE COMUNICAÇÃO COM O CONJUR ---

// Função para obter o token de acesso temporário do Conjur
async function getConjurToken() {
  const conjurUrl = process.env.CONJUR_URL;
  const account = process.env.CONJUR_ACCOUNT;
  // O ID de login precisa ser codificado para a URL
  const loginId = encodeURIComponent(process.env.CONJUR_LOGIN_ID);
  const apiKey = process.env.CONJUR_API_KEY;

  if (!conjurUrl || !account || !loginId || !apiKey) {
    throw new Error("Variáveis de ambiente do Conjur não configuradas.");
  }

  const authUrl = `${conjurUrl}/authn/${account}/${loginId}/authenticate`;

  // Em ambientes de teste, o Conjur pode usar certificados autoassinados.
  // Se você receber um erro de SSL, descomente as linhas abaixo.
  // const https = require('https');
  // const agent = new https.Agent({ rejectUnauthorized: false });

  const response = await axios.post(authUrl, apiKey, {
    headers: { 'Content-Type': 'text/plain', 'Accept-Encoding': 'identity' }, // Cabeçalho importante
    // httpsAgent: agent, // Descomente se precisar de SSL não verificado
  });

  return response.data; // Retorna o token temporário
}

// --- ROTAS DA API DE CREDENCIAIS ---

// Rota POST / para CRIAR uma nova credencial
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { name, credential, value } = req.body;

      if (!name || !credential || !value) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
      }

      // 1. Obter o token temporário do Conjur
      const conjurToken = await getConjurToken();

      // 2. Definir o caminho do segredo no Conjur (ex: NOME_DA_CONTA:variable:caminho/do/segredo)
      const secretPath = `${process.env.CONJUR_ACCOUNT}:variable:${name}/${credential}`;

      // 3. Usar o token para salvar o segredo no Conjur
      await axios.post(
        `${process.env.CONJUR_URL}/secrets`,
        value,
        {
          headers: {
            'Authorization': `Token token="${Buffer.from(conjurToken).toString('base64')}"`,
            'Content-Type': 'text/plain'
          },
          // httpsAgent: agent, // Descomente se precisar de SSL não verificado
        }
      );
      
      // 4. Salvar a REFERÊNCIA no nosso banco de dados PostgreSQL (sem salvar o valor!)
      await prisma.credential.create({
        data: {
          name: name,
          path: `${name}/${credential}`, // Salva o caminho para referência futura
        }
      });

      res.status(201).json({ message: "Credencial salva com sucesso no Conjur." });

    } catch (error) {
      console.error("Erro ao salvar no Conjur:", error.response?.data || error.message);
      res.status(500).json({ message: "Falha ao comunicar com o Conjur." });
    }
  }
);

export default router;