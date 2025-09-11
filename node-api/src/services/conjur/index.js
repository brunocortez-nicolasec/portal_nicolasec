import express from "express";
import passport from "passport";
import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";

const router = express.Router();
const isAuthenticated = passport.authenticate("jwt", { session: false });

// --- FUNÇÃO AUXILIAR PARA OBTER O TOKEN DO CONJUR ---
// Colocamos a lógica em uma função separada para ser reutilizada
async function getConjurToken() {
  const conjurUrl = process.env.CONJUR_URL;
  const account = process.env.CONJUR_ACCOUNT;
  const loginId = encodeURIComponent(process.env.CONJUR_LOGIN_ID);
  const apiKey = process.env.CONJUR_API_KEY;

  if (!conjurUrl || !account || !loginId || !apiKey) {
    throw new Error("Variáveis de ambiente do Conjur não configuradas no backend.");
  }

  const authUrl = `${conjurUrl}/authn/${account}/${loginId}/authenticate`;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Caminho corrigido para a pasta 'certs' na raiz do projeto
  const certPath = path.resolve(__dirname, 'cert.pem');
  const keyPath = path.resolve(__dirname, 'key.pem');

  const agent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: false,
  });

  const response = await axios.post(authUrl, apiKey, {
    headers: {
      'Accept-Encoding': 'base64'
    },
    httpsAgent: agent,
  });

  return response.data; // Retorna o token
}


// --- ROTAS DA API ---

// 1. Rota para o frontend obter o token inicial
router.post("/token", isAuthenticated, async (req, res) => {
  try {
    const conjurToken = await getConjurToken();
    res.status(200).json({ token: conjurToken });
  } catch (error) {
    console.error("Erro ao obter token do Conjur:", error.response?.data || error.message);
    res.status(500).json({ message: "Falha ao se autenticar com o Conjur." });
  }
});


// 2. Rota para buscar as políticas (o GET que você pediu)
router.get("/policies", isAuthenticated, async (req, res) => {
  try {
    const conjurToken = await getConjurToken();
    const conjurUrl = process.env.CONJUR_URL;
    const account = process.env.CONJUR_ACCOUNT;
    const policiesUrl = `${conjurUrl}/policies/${account}/policy/apps/`;
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const certPath = path.resolve(__dirname, 'cert.pem');
    const keyPath = path.resolve(__dirname, 'key.pem');
    
    const agent = new https.Agent({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      rejectUnauthorized: false,
    });

    const response = await axios.get(policiesUrl, {
      headers: {
        // --- 2. CORREÇÃO NA CODIFICAÇÃO DO TOKEN ---
        'Authorization': `Token token="${Buffer.from(conjurToken)}"`,
      },
      httpsAgent: agent,
    });

    // --- 3. CORREÇÃO NA RESPOSTA (CONVERSÃO DE YAML PARA JSON) ---
    const jsonData = yaml.parse(response.data);

    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Erro ao buscar políticas do Conjur:", error.response?.data || error.message);
    res.status(500).json({ message: "Falha ao buscar políticas do Conjur." });
  }
});

export default router;

