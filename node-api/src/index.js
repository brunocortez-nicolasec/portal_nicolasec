import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import "./passport.js"; // Importa a configuração do Passport (agora com Prisma)
import { meRoutes, authRoutes } from "./routes";
import usersRoutes from "./services/users/index.js";
import path from "path";
import * as fs from "fs";



dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

// Sua configuração do CORS está perfeita e permanece a mesma
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.APP_URL_CLIENT,
      'http://localhost:8080',
      'http://localhost:3080',
      'http://localhost:3080/',
      'http://localhost:8080/',
      "http://192.168.0.120",
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

// REMOVIDO: A chamada dbConnect() não é mais necessária.
// O Prisma Client gerencia as conexões automaticamente quando você faz a primeira consulta.

app.use(cors(corsOptions));
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false }));

app.get("/", function (req, res) {
  const __dirname = fs.realpathSync(".");
  res.sendFile(path.join(__dirname, "/src/landing/index.html"));
});

// As rotas permanecem as mesmas
app.use("/", authRoutes);
app.use("/me", meRoutes);
app.use("/users", usersRoutes);

// REMOVIDO: O bloco 'cron' que chamava o ReseedAction do Mongo foi removido.
// A forma de popular o banco com Prisma é diferente (usando um arquivo de seed).

app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));