import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import "./passport.js";
import { meRoutes, authRoutes } from "./routes";
import usersRoutes from "./services/users/index.js";
import conjurRoutes from "./services/conjur/index.js";
import rolesRoutes from "./services/roles/index.js";
import groupsRoutes from "./services/groups/index.js";
import platformsRoutes from "./services/platforms/index.js";
import packagesRoutes from "./services/packages/index.js";
import path from "path";
import * as fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.APP_URL_CLIENT,
      'http://localhost:8080',
      'http://localhost:3000', 
      'http://localhost:3080',
      'http://localhost:3080/',
      'http://localhost:8080/',
      "http://192.168.100.102",
      "http://192.168.0.115"
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

const jsonParser = bodyParser.json();

app.use(express.json());

app.get("/", function (req, res) {
  const __dirname = fs.realpathSync(".");
  res.sendFile(path.join(__dirname, "/src/landing/index.html"));
});

// Suas rotas existentes
app.use("/", authRoutes);
app.use("/me", meRoutes);
app.use("/users", usersRoutes);
app.use("/roles", rolesRoutes);
app.use("/groups", groupsRoutes);
app.use("/platforms", platformsRoutes);
app.use("/packages", packagesRoutes);
app.use("/conjur", jsonParser, conjurRoutes);


app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));