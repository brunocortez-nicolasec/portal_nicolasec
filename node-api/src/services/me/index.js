import bcrypt from "bcrypt";
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
dotenv.config();

// Sua função de buscar o perfil (sem alterações)
export const getProfileRouteHandler = async (req, res) => {
  try {
    const meUser = req.user;
    const sentData = {
      data: {
        type: 'users',
        id: meUser.id,
        attributes: {
          name: meUser.name,
          email: meUser.email,
          profile_image: meUser.profile_image,
          role: meUser.role,
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
};

// Sua função de atualizar o perfil (COM AS CORREÇÕES)
export const patchProfileRouteHandler = async (req, res) => {
  try {
    const currentUser = req.user; // Usuário identificado pelo token JWT

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Lendo os dados do local correto (dentro de data.attributes)
    const { name, email, newPassword, confirmPassword } = req.body.data.attributes;
    
    const dataToUpdate = {};

    // Adiciona os campos ao objeto de atualização apenas se eles foram fornecidos
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;

    if (newPassword) {
      if (newPassword.length < 8 || newPassword !== confirmPassword) {
        // Padronizando a resposta de erro para ser mais simples
        return res.status(400).json({ message: "As senhas devem ter no mínimo 8 caracteres e ser iguais." });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Atualiza o usuário no banco usando o ID do token
    await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
    });
    
    // Padronizando a resposta de sucesso
    res.status(200).json({ message: "Perfil atualizado com sucesso." });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Um erro inesperado aconteceu durante a atualização do perfil." });
  }
};