import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt"; // Apenas uma otimização na importação
import dotenv from "dotenv";
import passport from "passport";

// --- MUDANÇA PRINCIPAL: Importando o Prisma Client ---
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// A importação do Mongoose 'userModel' foi removida.

dotenv.config();

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    // A função agora é 'async' para podermos usar 'await'
    async function (jwtPayload, done) {
      try {
        // ANTES (Mongoose): userModel.findOne({ _id: jwtPayload.id })
        // DEPOIS (Prisma):
        const user = await prisma.user.findUnique({
          where: {
            id: jwtPayload.id,
          },
        });

        if (user) {
          return done(null, user); // Usuário encontrado, anexa ao request
        } else {
          return done(null, false); // Usuário não encontrado no banco
        }
      } catch (error) {
        return done(error, false); // Erro inesperado no servidor
      }
    }
  )
);