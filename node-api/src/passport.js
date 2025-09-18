import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import dotenv from "dotenv";
import passport from "passport";

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

dotenv.config();

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async function (jwtPayload, done) {
      try {
        // --- MUDANÇA PRINCIPAL AQUI ---
        // Adicionamos 'include: { role: true }' para buscar os dados da função relacionada
        const user = await prisma.user.findUnique({
          where: {
            id: jwtPayload.id,
          },
          include: {
            role: true, // Garante que o objeto 'role' seja incluído
          },
        });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);