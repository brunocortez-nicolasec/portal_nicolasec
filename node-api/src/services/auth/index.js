// node-api/src/services/auth/index.js

import dotenv from "dotenv";
import nodemailer from "nodemailer";
import randomToken from "random-token";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

dotenv.config();

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    // Busca o usuário e inclui os dados da sua função (role)
    const foundUser = await prisma.user.findUnique({
      where: { email: email },
      include: {
        role: true, // Pede ao Prisma para buscar o objeto Role relacionado
      },
    });

    if (!foundUser) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (validPassword) {
      // Usa o nome da função (foundUser.role.name) no payload do token
      const tokenPayload = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role ? foundUser.role.name : 'Sem função',
      };
      
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });
      
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

    // Busca a função "Membro" para usar como padrão no registro
    const defaultRole = await prisma.role.findUnique({
      where: { name: 'Membro' },
    });

    if (!defaultRole) {
      // Falha se a função "Membro" não existir no banco de dados
      return res.status(500).json({ message: "Função padrão 'Membro' não encontrada no sistema." });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    
    // Cria o novo usuário já associando o ID da função padrão
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashPassword,
        roleId: defaultRole.id, // Associa o usuário à função "Membro"
      },
    });

    // Inclui o nome da função no token de registro
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: defaultRole.name },
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

    await prisma.passwordReset.create({
      data: {
        email: foundUser.email,
        token: token,
      },
    });

    return res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("### ERRO AO ENVIAR EMAIL DE RESET ###:", error);
    return res.status(500).json({ message: "An unexpected error occurred while sending the email." });
  }
};

export const resetPasswordRouteHandler = async (req, res) => {
  try {
    const { email, token, password, password_confirmation } = req.body.data.attributes;

    const foundToken = await prisma.passwordReset.findFirst({
      where: { email, token },
    });

    if (!foundToken) {
      return res.status(400).json({
        errors: { email: ["The email or token is invalid or has expired."] },
      });
    }

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

    await prisma.user.update({
      where: { email: email },
      data: { password: hashPassword },
    });
    
    await prisma.passwordReset.deleteMany({
      where: { email: email },
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
};