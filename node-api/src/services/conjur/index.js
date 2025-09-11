import express from "express";
import passport from "passport";
import axios from "axios";
import https from "https"; // --- CORREÇÃO 1: Import do módulo 'https' nativo do Node.js ---
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const isAuthenticated = passport.authenticate("jwt", { session: false });

router.post("/token", isAuthenticated, async (req, res) => {
  try {
    const conjurUrl = process.env.CONJUR_URL;
    const account = process.env.CONJUR_ACCOUNT;
    const loginId = encodeURIComponent(process.env.CONJUR_LOGIN_ID);
    const apiKey = process.env.CONJUR_API_KEY;

    if (!conjurUrl || !account || !loginId || !apiKey) {
      throw new Error("Variáveis de ambiente do Conjur não configuradas no backend.");
    }

    // --- CORREÇÃO 2: URL de autenticação completa e correta ---
  const authUrl = `${conjurUrl}/authn/${account}/${loginId}/authenticate`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // --- CORREÇÃO 3: Caminho para a pasta 'certs' na raiz do projeto 'node-api' ---
    const certPath = path.resolve(__dirname, 'cert.pem');
    const keyPath = path.resolve(__dirname, 'key.pem');

    const agent = new https.Agent({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      rejectUnauthorized: false,
    });

    const response = await axios.post(authUrl, apiKey, {
      // --- CORREÇÃO 4: Cabeçalhos corretos para a API do Conjur ---
      headers: {
        'Accept-Encoding': 'base64'
      },
      httpsAgent: agent,
    });

    res.status(200).json({ token: response.data });
  } catch (error) {
    console.error("Erro detalhado ao obter token do Conjur:", error);
    res.status(500).json({ message: "Falha ao se autenticar com o Conjur." });
  }
});

export default router;