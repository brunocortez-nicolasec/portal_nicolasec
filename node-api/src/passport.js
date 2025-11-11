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
        // --- INÍCIO DA CORREÇÃO ---
        // Alterado 'role: true' para 'profile: true'
        const user = await prisma.user.findUnique({
          where: {
            id: jwtPayload.id,
          },
          include: {
            profile: true, // Busca o novo model 'Profile'
            package: {
              include: {
                platforms: true,
              },
            },
          },
        });
        // --- FIM DA CORREÇÃO ---

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