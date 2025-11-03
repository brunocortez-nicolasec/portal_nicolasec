// node-api/src/services/imports/index.js

import express from "express";
import passport from "passport";
import multer from "multer";
import { PrismaClient } from '@prisma/client';
import Papa from "papaparse";

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Lógica de Serviço ---

const getImportHistory = async (req, res) => {
  try {
    // Garante userId Int
    const userIdInt = parseInt(req.user.id, 10);
     if (isNaN(userIdInt)) {
         return res.status(400).json({ message: "ID de usuário inválido." });
     }
    const importLogs = await prisma.importLog.findMany({
      where: { userId: userIdInt }, // Filtra por usuário logado
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } }, // Inclui nome do usuário que importou
    });
    return res.status(200).json(importLogs);
  } catch (error) {
    console.error("Erro ao buscar histórico de importações:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const checkSystemData = async (req, res) => {
  const { system } = req.params;
  try {
    // Verifica se existem Accounts para sistemas não-RH, ou Identities para RH
    let count = 0;
    if (system.toUpperCase() === 'RH') {
        count = await prisma.identity.count({
            where: { sourceSystem: { equals: system, mode: 'insensitive' } },
        });
    } else {
        // Encontra o sistema primeiro para obter o ID
        const systemRecord = await prisma.system.findUnique({ where: { name: system }});
        if (systemRecord) {
            count = await prisma.account.count({
                where: { systemId: systemRecord.id },
            });
        } else {
             // Se o sistema não for encontrado, considera que não existem dados
             console.warn(`Sistema "${system}" não encontrado ao verificar dados existentes.`);
             // Não lança erro, apenas retorna exists: false
        }
    }
    return res.status(200).json({ exists: count > 0 });
  } catch (error) {
    console.error(`Erro ao verificar dados para o sistema ${system}:`, error);
    return res.status(500).json({ message: "Erro interno do servidor ao verificar dados." });
  }
};

// --- FUNÇÃO handleCsvUpload REFATORADA ---
const handleCsvUpload = async (req, res) => {
  const user = req.user;
  const file = req.file;
  const { targetSystem } = req.body; // Nome do sistema (String)

  if (!user || !file || !targetSystem) {
    return res.status(400).json({ message: "Dados incompletos para o upload." });
  }

  // Garante userId Int (ajuste se for String)
  const userIdInt = parseInt(user.id, 10);
  if (isNaN(userIdInt)){
      return res.status(400).json({ message: "ID de usuário inválido." });
  }

  // Cria o log inicial
  const importLog = await prisma.importLog.create({
    data: { fileName: file.originalname, targetSystem, status: "PENDING", userId: userIdInt },
  });

  let processedCount = 0; // Contador para linhas processadas com sucesso
  const warningsOrErrors = []; // Array para armazenar informações sobre linhas puladas/com avisos

  try {
    // Parse do CSV e validação de cabeçalho
    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    const fileHeaders = parsedCsv.meta.fields || [];
    const requiredHeaders = ['id_user', 'nome_completo', 'email', 'status', 'cpf', 'userType', 'last_login', 'perfil'];
    if (JSON.stringify(fileHeaders) !== JSON.stringify(requiredHeaders)) {
      throw new Error(`O cabeçalho do CSV não corresponde ao template. Esperado: [${requiredHeaders.join(', ')}], Recebido: [${fileHeaders.join(', ')}]`);
    }
    const rows = parsedCsv.data;
    if (rows.length === 0) {
      throw new Error("O arquivo CSV está vazio ou não contém dados.");
    }

    // Atualiza log para PROCESSING
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length },
    });

    // --- Início da Lógica Condicional RH vs Outros ---
    if (targetSystem.toUpperCase() === 'RH') {
      // --- LÓGICA PARA RH: Cria Identities ---
      await prisma.$transaction(async (tx) => {
        // 1. Limpa identities ANTIGAS do RH antes de inserir as novas
        await tx.identity.deleteMany({
          where: { sourceSystem: { equals: 'RH', mode: 'insensitive' } },
        });

        // 2. Processa cada linha do CSV para criar Identity
        for (const [index, row] of rows.entries()) {
          const id_user_rh = row.id_user;
          const cpf = row.cpf?.trim() || null;
          const email = row.email?.trim() || null;
          const linhaNum = index + 2;

          if (!id_user_rh) {
            warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - 'id_user' (ID no RH) ausente.`);
            continue;
          }
          if (!cpf && !email) {
             warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - CPF e Email ausentes (necessário ao menos um para unicidade).`);
             continue;
          }

          const lastLoginDate = row.last_login ? new Date(row.last_login) : null;
          const lastLoginIso = (lastLoginDate && !isNaN(lastLoginDate)) ? lastLoginDate.toISOString() : null;

          const identityData = {
            sourceSystem: 'RH',
            identityId: String(id_user_rh),
            name: row.nome_completo || null,
            email: email,
            status: row.status || null,
            cpf: cpf,
            userType: row.userType || null,
            extraData: {
              last_login: lastLoginIso,
            },
          };

          try {
              await tx.identity.create({ data: identityData });
              processedCount++;
          } catch (dbError) {
               if (dbError.code === 'P2002') {
                   const target = dbError.meta?.target || [];
                   if (target.includes('cpf')) {
                       warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - CPF '${cpf}' duplicado.`);
                   } else if (target.includes('email')) {
                       warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - Email '${email}' duplicado.`);
                   } else if (target.includes('sourceSystem') && target.includes('identityId')) {
                       warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - ID de usuário '${id_user_rh}' duplicado para o sistema RH.`);
                   } else {
                        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - Violação de constraint única (${target.join(', ')}).`);
                   }
               } else {
                    warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco ao criar identidade - ${dbError.message}`);
               }
               continue;
          }
        } // Fim for RH
      }); // Fim tx RH

    } else {
      // --- LÓGICA PARA OUTROS SISTEMAS: Cria Accounts (COM ALTERAÇÃO PARA IDENTITY OPCIONAL) ---
      const systemRecord = await prisma.system.findUnique({
          where: { name: targetSystem },
          select: { id: true }
      });
      if (!systemRecord) {
          throw new Error(`Sistema alvo "${targetSystem}" não encontrado no banco de dados.`);
      }
      const systemId = systemRecord.id;

      await prisma.$transaction(async (tx) => {
        // 2. Limpa Accounts ANTIGAS *deste sistema específico*
        await tx.account.deleteMany({
          where: { systemId: systemId },
        });

        // 3. Processa cada linha do CSV
        for (const [index, row] of rows.entries()) {
          const accountIdInSystem = row.id_user;
          const cpf = row.cpf?.trim() || null;
          const email = row.email?.trim() || null;
          const linhaNum = index + 2;

          if (!accountIdInSystem) {
            warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - 'id_user' (ID da Conta no Sistema) ausente.`);
            continue;
          }

          // 4. Tenta encontrar a Identity correspondente
          let correspondingIdentity = null;
          if (cpf) {
              correspondingIdentity = await tx.identity.findUnique({ where: { cpf } });
          }
          if (!correspondingIdentity && email) {
              correspondingIdentity = await tx.identity.findUnique({ where: { email } });
          }

          if (!correspondingIdentity) {
            // Apenas registra o aviso, mas NÃO usa 'continue'
            warningsOrErrors.push(`Linha ${linhaNum}: AVISO - Identidade correspondente não encontrada para CPF='${cpf}' ou Email='${email}'. Conta criada sem vínculo.`);
          }

          // Prepara dados da conta
          const lastLoginDate = row.last_login ? new Date(row.last_login) : null;
          const lastLoginIso = (lastLoginDate && !isNaN(lastLoginDate)) ? lastLoginDate.toISOString() : null;
          const profileName = row.perfil?.trim();

          const accountData = {
            accountIdInSystem: String(accountIdInSystem),
            name: row.nome_completo || null,
            email: email,
            status: row.status || null,
            userType: row.userType || null,
            cpf: cpf,
            extraData: {
              last_login: lastLoginIso,
            },
            // --- ID da Identidade agora é Opcional ---
            identityId: correspondingIdentity ? correspondingIdentity.id : null, // <<< Usa null se não encontrou
            systemId: systemId,
          };

          try {
              // 5. Cria a Account (agora sempre tenta criar)
              const newAccount = await tx.account.create({ data: accountData });

              // 6. Associa o Perfil (se houver) via AccountProfile
              if (profileName) {
                const profileRecord = await tx.profile.upsert({
                    where: { systemId_name: { systemId: systemId, name: profileName } },
                    update: {},
                    create: { name: profileName, systemId: systemId },
                    select: { id: true }
                });

                if (profileRecord) {
                    await tx.accountProfile.create({
                        data: {
                            accountId: newAccount.id,
                            profileId: profileRecord.id,
                        }
                    });
                } else {
                     warningsOrErrors.push(`Linha ${linhaNum}: AVISO - Perfil "${profileName}" não pôde ser encontrado ou criado.`);
                }
              }
              processedCount++; // Incrementa se a conta foi criada com sucesso

          } catch (dbError) {
              // Captura erro de constraint unique da conta ou perfil
              if (dbError.code === 'P2002') {
                   const target = dbError.meta?.target || [];
                   if (target.includes('systemId') && target.includes('name')) {
                        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - Perfil com nome '${profileName}' já existe neste sistema (ou falha no upsert).`);
                   } else if (target.includes('systemId') && target.includes('accountIdInSystem')) {
                       warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - ID da conta '${accountIdInSystem}' duplicado para o sistema ${targetSystem}.`);
                   } else {
                       warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco - Violação de constraint única (${target.join(', ')}).`);
                   }
              } else {
                  warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco ao criar conta/perfil - ${dbError.message}`);
              }
              continue; // Pula para a próxima linha SE HOUVE ERRO DE BANCO
          }
        } // Fim for Outros
      }); // Fim tx Outros
    } // Fim else Outros

    // --- Finalização do Log ---
    const hasErrors = warningsOrErrors.some(msg => msg.includes("IGNORADA")); // Verifica se houve erros que impediram o processamento
    const finalStatus = hasErrors ? "FAILED" : "SUCCESS"; // Se qualquer linha foi IGNORADA, status é FAILED
    const errorDetails = warningsOrErrors.length > 0
        ? `Processadas ${processedCount} de ${rows.length} linhas.\n${hasErrors ? 'Erros/Avisos' : 'Avisos'}:\n- ${warningsOrErrors.join('\n- ')}`
        : null;

    const finishedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: finalStatus,
        processedRows: processedCount,
        completedAt: new Date(),
        errorDetails: errorDetails,
      },
      include: { user: { select: { name: true } } },
    });

    // Retorna 201 (criado/sucesso) ou 207 (multi-status se houve SOMENTE avisos), ou mantém 207 se houve ERROS (linhas ignoradas)
    return res.status(finalStatus === "SUCCESS" ? (warningsOrErrors.length > 0 ? 207 : 201) : 207).json(finishedLog);


  } catch (error) { // Erro GERAL
    console.error(`Falha CRÍTICA ao processar importação #${importLog.id} para ${targetSystem}:`, error);
    try {
        const failedLog = await prisma.importLog.update({
          where: { id: importLog.id },
          data: {
            status: "FAILED",
            errorDetails: error.message || "Erro desconhecido durante o processamento.",
            completedAt: new Date(),
          },
          include: { user: { select: { name: true } } },
        });
         return res.status(error.message.includes("Sistema alvo") || error.message.includes("cabeçalho") || error.message.includes("vazio") ? 400 : 500).json(failedLog);
    } catch (updateError) {
         console.error(`Falha ao ATUALIZAR o log #${importLog.id} para FAILED:`, updateError);
          return res.status(500).json({ message: error.message || "Erro interno crítico durante processamento e falha ao atualizar log." });
    }
  }
};


// --- Função deleteImportLog SIMPLIFICADA ---
const deleteImportLog = async (req, res) => {
  const logId = parseInt(req.params.id, 10);
  if (isNaN(logId)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  // Garante userId Int
  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
  }


  try {
    // Adiciona userId na cláusula where para segurança
    const deleteResult = await prisma.importLog.deleteMany({
        where: {
             id: logId,
             userId: userIdInt // Garante que só delete logs do próprio usuário
         }
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: "Registro de importação não encontrado ou não pertence a este usuário." });
    }

    return res.status(204).send();

  } catch (error) {
    console.error(`Erro ao deletar o log de importação #${logId}:`, error);
     if (error.code === 'P2003') {
        return res.status(409).json({ message: "Não é possível excluir este log pois ele está sendo referenciado em outro lugar." });
    }
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// --- Definição das Rotas ---
router.get("/", passport.authenticate("jwt", { session: false }), getImportHistory);
router.get("/check/:system", passport.authenticate("jwt", { session: false }), checkSystemData);
router.post("/", passport.authenticate("jwt", { session: false }), upload.single("csvFile"), handleCsvUpload);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteImportLog);

export default router;