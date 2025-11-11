import bcrypt from "bcrypt";
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
dotenv.config();

export const getProfileRouteHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    // --- INÍCIO DA CORREÇÃO ---
    // Busca o usuário e inclui o profile e o package (com suas platforms)
    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true, // Corrigido de 'role' para 'profile'
        package: {
          include: {
            platforms: true,
          },
        },
      },
    });
    // --- FIM DA CORREÇÃO ---

    if (!foundUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Monta a resposta, agora incluindo o objeto 'package' completo
    const sentData = {
      data: {
        type: 'users',
        id: foundUser.id,
        attributes: {
          name: foundUser.name,
          email: foundUser.email,
          profile_image: foundUser.profile_image,
          // --- INÍCIO DA CORREÇÃO ---
          // Corrigido para ler de 'foundUser.profile'
          // Mantemos a chave 'role' para compatibilidade com o frontend
          role: foundUser.profile ? foundUser.profile.name : "Sem perfil",
          // --- FIM DA CORREÇÃO ---
          package: foundUser.package || null,
          createdAt: foundUser.createdAt,
          updatedAt: foundUser.updatedAt
        }
      }
    }
    res.send(sentData);
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ message: "Um erro inesperado ocorreu ao buscar o perfil." });
  }
};

export const patchProfileRouteHandler = async (req, res) => {
  try {
    const currentUser = req.user;
    const { name, email, newPassword, confirmPassword, profile_image } = req.body.data.attributes;
    
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (profile_image) dataToUpdate.profile_image = profile_image;

    if (newPassword) {
      if (newPassword.length < 8 || newPassword !== confirmPassword) {
        return res.status(400).json({ message: "As senhas devem ter no mínimo 8 caracteres e ser iguais." });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(newPassword, salt);
    }
    
    await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
    });
    
    res.status(200).json({ message: "Perfil atualizado com sucesso." });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Um erro inesperado aconteceu durante a atualização do perfil." });
  }
};