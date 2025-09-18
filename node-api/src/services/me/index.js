import bcrypt from "bcrypt";
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
dotenv.config();

// --- FUNÇÃO DE BUSCAR O PERFIL (COM A CORREÇÃO) ---
export const getProfileRouteHandler = async (req, res) => {
  try {
    // 1. Pega o ID do usuário a partir do token (única informação que vamos usar dele)
    const userId = req.user.id;

    // 2. Busca o usuário mais recente do banco de dados, incluindo sua função (role)
    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
      // A mágica acontece aqui: "include" busca os dados da tabela relacionada
      include: {
        role: true, // Isso vai incluir um objeto "role" com "id" e "name"
      },
    });

    if (!foundUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // 3. Monta o objeto de resposta com os dados corretos e atualizados
    const sentData = {
      data: {
        type: 'users',
        id: foundUser.id,
        attributes: {
          name: foundUser.name,
          email: foundUser.email,
          profile_image: foundUser.profile_image,
          // Agora passamos o NOME da função
          role: foundUser.role ? foundUser.role.name : "Sem função", 
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

// --- FUNÇÃO DE ATUALIZAR O PERFIL (SEM ALTERAÇÕES) ---
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