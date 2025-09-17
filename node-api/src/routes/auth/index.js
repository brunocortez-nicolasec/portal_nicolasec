import express from "express";
import {
  forgotPasswordRouteHandler,
  loginRouteHandler,
  registerRouteHandler,
  resetPasswordRouteHandler,
} from "../../services/auth";

const router = express.Router();

// --- MUDANÇA AQUI ---
// A rota agora passa a requisição diretamente para o handler,
// que é responsável por ler o corpo da requisição.
router.post("/auth/login", loginRouteHandler);


// O resto do arquivo permanece como está
router.post("/auth/logout", (req, res) => {
  return res.sendStatus(204);
});

router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body.data.attributes;
  await registerRouteHandler(req, res, name, email, password);
});

router.post("/auth/password-forgot", async (req, res) => {
  const { email } = req.body.data.attributes;
  await forgotPasswordRouteHandler(req, res, email);
});

router.post("/auth/password-reset", async (req, res) => {
  await resetPasswordRouteHandler(req, res);
});

export default router;