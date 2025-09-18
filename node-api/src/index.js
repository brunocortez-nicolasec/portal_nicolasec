import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import "./passport.js";
import { meRoutes, authRoutes } from "./routes";
import usersRoutes from "./services/users/index.js";
import conjurRoutes from "./services/conjur/index.js";
import rolesRoutes from "./services/roles/index.js";
import path from "path";
import * as fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

const corsOptions = {
  // ... (Sua configuração de CORS permanece intacta)
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.APP_URL_CLIENT,
      'http://localhost:8080',
      'http://localhost:3000', 
      'http://localhost:3080',
      'http://localhost:3080/',
      'http://localhost:8080/',
      "http://192.168.100.115",
      "http://192.168.0.117"
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
  allowedHeaders: "Content-Type, Authorization", 
};

app.use(cors(corsOptions));

// --- ALTERAÇÃO PARA COMPATIBILIDADE ---
// Criamos um "parser" específico para JSON padrão, que será usado APENAS pela nova rota.
const jsonParser = bodyParser.json();

// O seu bodyParser global para o formato JSON:API permanece o mesmo.
app.use(express.json());

app.get("/", function (req, res) {
  const __dirname = fs.realpathSync(".");
  res.sendFile(path.join(__dirname, "/src/landing/index.html"));
});

// Suas rotas existentes (sem alterações)
app.use("/", authRoutes);
app.use("/me", meRoutes);
app.use("/users", usersRoutes);
app.use("/conjur", jsonParser, conjurRoutes);
app.use("/roles", rolesRoutes);

app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));