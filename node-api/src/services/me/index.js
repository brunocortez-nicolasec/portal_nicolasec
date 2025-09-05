import bcrypt from "bcrypt";
import dotenv from 'dotenv';

// --- MUDANÇA PRINCIPAL: Importando o Prisma Client ---
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// A importação antiga do 'userModel' foi removida.

dotenv.config();

export const getProfileRouteHandler = async (req, res) => {
  try {
    // req.user já contém os dados do usuário do banco, pois foi carregado pelo Passport.js (que já migramos)
    const meUser = req.user;

    // Apenas formatamos os dados no padrão JSON:API que o frontend espera
    const sentData = {
      data: {
        type: 'users',
        id: meUser.id,
        attributes: {
          name: meUser.name,
          email: meUser.email,
          profile_image: meUser.profile_image,
          role: meUser.role, // Adicionando a role à resposta
          createdAt: meUser.createdAt,
          updatedAt: meUser.updatedAt
        }
      }
    }
    res.send(sentData);

  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ message: "Um erro inesperado ocorreu ao buscar o perfil." });
  }
}

export const patchProfileRouteHandler = async (req, res) => {
  try {
    const currentUser = req.user; // Usuário identificado pelo token JWT
    const { name, email, newPassword, confirmPassword } = req.body;
    
    let dataToUpdate = {};

    // Adiciona os campos ao objeto de atualização apenas se eles foram fornecidos
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;

    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ errors: { password: ["A senha deve ter pelo menos 8 caracteres."] }});
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ errors: { password: ["A senha e a confirmação de senha precisam ser iguais."] }});
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Atualiza o usuário no banco usando o ID do token
    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: dataToUpdate,
    });
    
    // Envia de volta os dados atualizados (sem a senha) no formato JSON:API
    const sentData = {
      data: {
        type: 'users',
        id: updatedUser.id,
        attributes: {
          name: updatedUser.name,
          email: updatedUser.email,
          profile_image: updatedUser.profile_image,
          role: updatedUser.role
        }
      }
    }
    res.send(sentData);

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Um erro inesperado aconteceu durante a atualização do perfil." });
  }
}