import dotenv from "dotenv";
import nodemailer from "nodemailer";
import randomToken from "random-token";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

// --- MUDANÇA PRINCIPAL: Importando e inicializando o Prisma Client ---
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// As importações antigas dos Schemas do Mongoose foram removidas.

dotenv.config();

// A configuração do Nodemailer (envio de email) permanece a mesma
const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

export const loginRouteHandler = async (req, res) => {
  try {
    // 1. Lendo os dados diretamente do corpo da requisição
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    const foundUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!foundUser) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (validPassword) {
      const token = jwt.sign(
        { id: foundUser.id, email: foundUser.email, role: foundUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      // 2. Enviando a resposta no formato simplificado que o frontend espera
      return res.status(200).json({ token: token });
    } else {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Ocorreu um erro interno no servidor." });
  }
};

export const registerRouteHandler = async (req, res, name, email, password) => {
  try {
    const foundUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (foundUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    
    // Cria um novo usuário no banco de dados com Prisma
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashPassword,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      token_type: "Bearer",
      expires_in: "24h",
      access_token: token,
      refresh_token: token,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "An unexpected error occurred during registration." });
  }
};

export const forgotPasswordRouteHandler = async (req, res, email) => {
  try {
    const foundUser = await prisma.user.findUnique({ where: { email } });

    if (!foundUser) {
      return res.status(400).json({
        errors: { email: ["The email does not match any existing user."] },
      });
    }

    const token = randomToken(20);

    // --- LINHA CORRIGIDA E ATIVADA ---
    await transporter.sendMail({
      from: '"Seu Portal" <no-reply@seuportal.com>',
      to: email,
      subject: "Recuperação de Senha do Portal",
      html: `
        <p>Olá ${foundUser.name},</p>
        <p>Você solicitou a recuperação de senha. Clique no link abaixo para criar uma nova senha (válido por um tempo limitado):</p>
        <p><a href="${process.env.APP_URL_CLIENT}/authentication/reset-password-cover?token=${token}&email=${email}">Redefinir Minha Senha</a></p>
        <p>Se você não solicitou isso, por favor, ignore este email.</p>
      `,
    });

    // Cria um registro de reset de senha no novo banco de dados
    await prisma.passwordReset.create({
      data: {
        email: foundUser.email,
        token: token,
      },
    });

    return res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (error) {
    // Se houver um erro (ex: credenciais do Mailtrap erradas), ele aparecerá aqui
    console.error("### ERRO AO ENVIAR EMAIL DE RESET ###:", error);
    return res.status(500).json({ message: "An unexpected error occurred while sending the email." });
  }
};

export const resetPasswordRouteHandler = async (req, res) => {
  try {
    const { email, token, password, password_confirmation } = req.body.data.attributes;

    // Busca o pedido de reset que corresponde ao email E ao token
    const foundToken = await prisma.passwordReset.findFirst({
      where: { email, token },
    });

    if (!foundToken) {
      return res.status(400).json({
        errors: { email: ["The email or token is invalid or has expired."] },
      });
    }

    // A validação da senha permanece a mesma
    if (password.length < 8) {
      return res.status(400).json({
        errors: { password: ["The password should have at least 8 characters."] },
      });
    }
    if (password !== password_confirmation) {
      return res.status(400).json({
        errors: { password: ["The password and password confirmation must match."] },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Atualiza a senha do usuário no banco de dados
    await prisma.user.update({
      where: { email: email },
      data: { password: hashPassword },
    });
    
    // Apaga todos os tokens de reset para aquele email, para que não possam ser reutilizados
    await prisma.passwordReset.deleteMany({
      where: { email: email },
    });

    return res.sendStatus(204); // Sucesso, sem conteúdo para retornar
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
};