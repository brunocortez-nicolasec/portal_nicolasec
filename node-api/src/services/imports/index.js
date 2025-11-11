// node-api/src/services/imports/index.js

import express from "express";
import passport from "passport";
import multer from "multer";
import { PrismaClient } from '@prisma/client';
import Papa from "papaparse";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper para encontrar o arquivo CSV único no diretório ---
const findSingleCsvInDir = async (directoryPath) => {
  const basePath = process.cwd();
  const absolutePath = path.resolve(basePath, directoryPath);

  let stats;
  try {
    stats = await fs.promises.stat(absolutePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`O diretório '${directoryPath}' não foi encontrado no servidor.`);
    }
    throw err;
  }

  if (!stats.isDirectory()) {
    throw new Error(`O caminho '${directoryPath}' não é um diretório, mas sim um arquivo.`);
  }

  const files = await fs.promises.readdir(absolutePath);
  const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));

  if (csvFiles.length === 0) {
    throw new Error("Nenhum arquivo CSV (.csv) foi encontrado no diretório especificado.");
  }
  if (csvFiles.length > 1) {
    throw new Error(`Múltiplos arquivos CSV encontrados (${csvFiles.join(', ')}). O diretório deve conter apenas um único arquivo CSV.`);
  }

  return path.join(absolutePath, csvFiles[0]);
};


// --- Lógica de Serviço ---

const getImportHistory = async (req, res) => {
  try {
    const userIdInt = parseInt(req.user.id, 10);
      if (isNaN(userIdInt)) {
        return res.status(400).json({ message: "ID de usuário inválido." });
      }
    const importLogs = await prisma.importLog.findMany({
      where: { userId: userIdInt }, 
      orderBy: { createdAt: "desc" },
      include: { 
        user: { select: { name: true } },
        dataSource: { select: { name_datasource: true } } 
      },
    });
    return res.status(200).json(importLogs);
  } catch (error) {
    console.error("Erro ao buscar histórico de importações:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

// ======================= INÍCIO DAS NOVAS LÓGICAS DE PROCESSAMENTO =======================

/**
 * Processa e salva dados da FONTE AUTORITATIVA (RH)
 */
const processAndSaveData_RH = async (tx, dataSourceId, rows, mapeamento) => {
  let processedCount = 0;
  const warningsOrErrors = [];

  // 1. Limpa os dados antigos desta fonte
  await tx.identitiesHR.deleteMany({ where: { dataSourceId: dataSourceId } });

  // 2. Processa cada linha
  for (const [index, csvRow] of rows.entries()) {
    const linhaNum = index + 2; 
    const dataToSave = {};

    // 3. O "TRADUTOR"
    for (const [appColumn, csvColumn] of Object.entries(mapeamento)) {
      if (appColumn === "id" || appColumn === "dataSourceId") continue;
      if (csvColumn && csvRow[csvColumn] !== undefined) {
        dataToSave[appColumn] = csvRow[csvColumn];
      }
    }
    
    // 4. Validação de ID
    const idColumnName = "identity_id_hr";
    if (!dataToSave[idColumnName]) {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Coluna de ID ('${idColumnName}') não foi mapeada ou está vazia.`);
        continue;
    }

    // 5. Salva no banco
    try {
      dataToSave.dataSourceId = dataSourceId; // Adiciona a "etiqueta"
      await tx.identitiesHR.create({ data: dataToSave });
      processedCount++;
    } catch (dbError) {
      if (dbError.code === 'P2002') {
        const target = dbError.meta?.target || [];
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Violação de constraint única (${target.join(', ')}).`);
      } else {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco: ${dbError.message}`);
      }
      continue;
    }
  } // Fim do Loop FOR

  return { processedCount, warningsOrErrors };
};

/**
 * Processa e salva dados de CONTAS (SISTEMA)
 */
const processAndSaveData_Contas = async (tx, systemId, rows, mapeamento) => {
  let processedCount = 0;
  const warningsOrErrors = [];
  
  // 1. Limpa os dados antigos (Assignments E Accounts) deste sistema
  await tx.assignment.deleteMany({
    where: { account: { systemId: systemId } }
  });
  await tx.accounts.deleteMany({ 
    where: { systemId: systemId } 
  });

  // 2. Processa cada linha
  for (const [index, csvRow] of rows.entries()) {
    const linhaNum = index + 2; 
    const dataToSave = {};
    let identityBusinessKey = null; // O ID do RH (ex: "MAT123") vindo do CSV

    // 3. O "TRADUTOR"
    for (const [dbColumn, csvColumn] of Object.entries(mapeamento)) {
      // Filtra apenas chaves de Contas
      if (dbColumn.startsWith("accounts_") && csvColumn && csvRow[csvColumn] !== undefined) {
        
        // Verifica se é o campo de correlação
        if (dbColumn === "accounts_identity_id") {
          identityBusinessKey = csvRow[csvColumn];
          continue; // Não salva este no dataToSave
        }
        
        // Converte 'accounts_name' para 'name_account'
        const appColumn = dbColumn.replace("accounts_", ""); 
        dataToSave[appColumn] = csvRow[csvColumn];
      }
    }
    
    // 4. Validação de ID
    const idColumnName = "id_in_system_account";
    if (!dataToSave[idColumnName]) {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Coluna de ID ('${idColumnName}') não foi mapeada ou está vazia.`);
        continue;
    }
    
    // 5. Lógica de CORRELAÇÃO (A "Mágica")
    if (!identityBusinessKey) {
       warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - O campo de correlação 'accounts_identity_id' (FK do RH) não foi mapeado ou está vazio no CSV.`);
       continue;
    }
    
    try {
      // Busca a Identidade (ex: "MAT123") para encontrar a PK (ex: 42)
      const identity = await tx.identitiesHR.findUnique({
        where: { identity_id_hr: identityBusinessKey }
      });
      
      if (!identity) {
         warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - A Identidade com ID RH '${identityBusinessKey}' não foi encontrada na tabela 'IdentitiesHR'.`);
         continue;
      }
      
      // 6. Salva no banco
      dataToSave.systemId = systemId; // Adiciona a FK do Sistema
      dataToSave.identityId = identity.id; // Adiciona a FK da Identidade
      
      await tx.accounts.create({ data: dataToSave });
      processedCount++;
      
    } catch (dbError) {
      if (dbError.code === 'P2002') {
        const target = dbError.meta?.target || [];
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Violação de constraint única (${target.join(', ')}).`);
      } else {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco: ${dbError.message}`);
      }
      continue;
    }
  } // Fim do Loop FOR

  return { processedCount, warningsOrErrors };
};

/**
 * Processa e salva dados de RECURSOS (SISTEMA)
 */
const processAndSaveData_Recursos = async (tx, systemId, rows, mapeamento) => {
  let processedCount = 0;
  const warningsOrErrors = [];

  // 1. Limpa os dados antigos (Assignments E Resources) deste sistema
  await tx.assignment.deleteMany({
    where: { resource: { systemId: systemId } }
  });
  await tx.resource.deleteMany({ 
    where: { systemId: systemId } 
  });

  // 2. Processa cada linha
  for (const [index, csvRow] of rows.entries()) {
    const linhaNum = index + 2; 
    const dataToSave = {};

    // 3. O "TRADUTOR"
    for (const [dbColumn, csvColumn] of Object.entries(mapeamento)) {
      // Filtra apenas chaves de Recursos
      if (dbColumn.startsWith("resources_") && csvColumn && csvRow[csvColumn] !== undefined) {
        // Converte 'resources_name' para 'name_resource'
        const appColumn = dbColumn.replace("resources_", ""); 
        dataToSave[appColumn] = csvRow[csvColumn];
      }
    }
    
    // 4. Validação de ID
    const idColumnName = "name_resource";
    if (!dataToSave[idColumnName]) {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Coluna de ID ('${idColumnName}') não foi mapeada ou está vazia.`);
        continue;
    }

    // 5. Salva no banco
    try {
      dataToSave.systemId = systemId; // Adiciona a FK do Sistema
      
      await tx.resource.create({ data: dataToSave });
      processedCount++;
      
    } catch (dbError) {
      if (dbError.code === 'P2002') {
        const target = dbError.meta?.target || [];
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Violação de constraint única (${target.join(', ')}).`);
      } else {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Erro de banco: ${dbError.message}`);
      }
      continue;
    }
  } // Fim do Loop FOR

  return { processedCount, warningsOrErrors };
};

// ======================= FIM DAS NOVAS LÓGICAS DE PROCESSAMENTO =======================


// --- FUNÇÃO DE PROCESSAMENTO (FLUXO B: POR DIRETÓRIO) ---
const handleDirectoryProcess = async (req, res) => {
  const user = req.user;
  // ======================= INÍCIO DA ALTERAÇÃO =======================
  const { dataSourceId, processingTarget } = req.body; // <-- 'processingTarget' ADICIONADO
  // ======================== FIM DA ALTERAÇÃO =========================

  if (!user || !dataSourceId) {
    return res.status(400).json({ message: "Dados incompletos para a importação." });
  }
  // ======================= INÍCIO DA ALTERAÇÃO =======================
  if (!processingTarget) {
     return res.status(400).json({ message: "O 'processingTarget' (alvo do processamento) é obrigatório." });
  }
  // ======================== FIM DA ALTERAÇÃO =========================

  const userIdInt = parseInt(user.id, 10);
  const dataSourceIdInt = parseInt(dataSourceId, 10);
  if (isNaN(userIdInt) || isNaN(dataSourceIdInt)){
    return res.status(400).json({ message: "ID de usuário ou Fonte de Dados inválido." });
  }

  let dataSource;
  try {
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    // 'include' atualizado para 'systemConfig'
    dataSource = await prisma.dataSource.findFirst({
      where: { id: dataSourceIdInt, userId: userIdInt },
      include: {
        hrConfig: true,
        idmConfig: true,
        systemConfig: { // <-- ATUALIZADO
          include: {
            system: true // Para pegar o systemId
          }
        },
        mappingRH: true,
        mappingIDM: true,
        mappingSystem: true,
      }
    });
    // ======================== FIM DA ALTERAÇÃO =========================
    if (!dataSource) {
      return res.status(404).json({ message: "Fonte de Dados não encontrada." });
    }
  } catch (e) {
    return res.status(500).json({ message: `Erro ao buscar configuração da Fonte de Dados: ${e.message}`});
  }

  const importLog = await prisma.importLog.create({
    data: { 
      fileName: `Processamento (Diretório) - ${dataSource.name_datasource}`, 
      status: "PENDING", 
      userId: userIdInt,
      dataSourceId: dataSourceIdInt 
    },
  });

  try {
    const { origem_datasource: origem } = dataSource;

    // ======================= INÍCIO DA ALTERAÇÃO (Switch Logic) =======================
    // Variáveis movidas para dentro do 'switch'
    
    let diretorio = null;
    let mapeamento = null;
    let rows = [];
    let csvFileName = `Processamento - ${dataSource.name_datasource}`;
    let processFunction = null; // Função de processamento a ser chamada
    let systemId = null; // Apenas para SISTEMA
    
    switch (origem) {
      case "RH":
        if (!dataSource.hrConfig) throw new Error("Configuração de RH (HRConfig) não encontrada.");
        if (!dataSource.mappingRH) throw new Error("Mapeamento (DataMappingRH) não encontrado.");
        
        diretorio = dataSource.hrConfig.diretorio_hr;
        mapeamento = dataSource.mappingRH; 
        processFunction = (tx, rows) => processAndSaveData_RH(tx, dataSource.id, rows, mapeamento);
        break;

      case "IDM":
        throw new Error("Importação via Diretório não suportada para IDM.");
        
      case "SISTEMA":
        if (!dataSource.systemConfig) throw new Error("Configuração de Sistema (SystemConfig) não encontrada.");
        if (!dataSource.systemConfig.system) throw new Error("Configuração de Sistema (SystemConfig) não está ligada a um Catálogo (System).");
        if (!dataSource.mappingSystem) throw new Error("Mapeamento (DataMappingSystem) não encontrado.");
        
        systemId = dataSource.systemConfig.systemId; // ID do Catálogo (ex: "SAP")
        mapeamento = dataSource.mappingSystem;
        
        if (processingTarget === "CONTAS") {
          diretorio = dataSource.systemConfig.diretorio_contas;
          if (dataSource.systemConfig.tipo_fonte_contas !== "CSV") {
            throw new Error("Processamento via diretório só é suportado para tipo de fonte 'CSV'.");
          }
          processFunction = (tx, rows) => processAndSaveData_Contas(tx, systemId, rows, mapeamento);
          
        } else if (processingTarget === "RECURSOS") {
          diretorio = dataSource.systemConfig.diretorio_recursos;
           if (dataSource.systemConfig.tipo_fonte_recursos !== "CSV") {
            throw new Error("Processamento via diretório só é suportado para tipo de fonte 'CSV'.");
          }
          processFunction = (tx, rows) => processAndSaveData_Recursos(tx, systemId, rows, mapeamento);
          
        } else {
          throw new Error(`Alvo de processamento ('${processingTarget}') desconhecido para SISTEMA.`);
        }
        
        break;
        
      default:
        throw new Error("Origem de dados desconhecida.");
    }

    if (!diretorio) {
      throw new Error(`O diretório para '${origem}${origem === 'SISTEMA' ? ` - ${processingTarget}` : ''}' não está configurado.`);
    }
    
    const fullCsvPath = await findSingleCsvInDir(diretorio);
    csvFileName = path.basename(fullCsvPath);
    const fileContent = await fs.promises.readFile(fullCsvPath, "utf8");
    
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    rows = parsedCsv.data;
    if (rows.length === 0) {
      throw new Error("O arquivo CSV encontrado está vazio.");
    }
    // ======================== FIM DA ALTERAÇÃO (Switch Logic) =========================

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length, fileName: csvFileName },
    });

    // Chama a lógica central correta (RH, Contas, ou Recursos)
    const { processedCount, warningsOrErrors } = await prisma.$transaction(async (tx) => {
      return processFunction(tx, rows);
    });

    // Finalização do Log
    const hasErrors = warningsOrErrors.some(msg => msg.includes("IGNORADA"));
    const finalStatus = hasErrors ? "FAILED" : "SUCCESS";
    const errorDetails = warningsOrErrors.length > 0
      ? `Processadas ${processedCount} de ${rows.length} linhas.\n${hasErrors ? 'Erros/Avisos' : 'Avisos'}:\n- ${warningsOrErrors.join('\n- ')}`
      : null;

    const finishedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: finalStatus, processedRows: processedCount, completedAt: new Date(), errorDetails: errorDetails },
      include: { user: { select: { name: true } }, dataSource: { select: { name_datasource: true } } },
    });

    return res.status(finalStatus === "SUCCESS" ? (warningsOrErrors.length > 0 ? 207 : 201) : 201).json(finishedLog);

  } catch (error) { // Erro GERAL
    console.error(`Falha CRÍTICA ao processar importação #${importLog.id}:`, error);
    try {
      const failedLog = await prisma.importLog.update({
        where: { id: importLog.id },
        data: { status: "FAILED", errorDetails: error.message, completedAt: new Date() },
        include: { user: { select: { name: true } }, dataSource: { select: { name_datasource: true } } },
      });
      return res.status(error.message.includes("não encontrado") ? 400 : 500).json(failedLog);
    } catch (updateError) {
      console.error(`Falha ao ATUALIZAR o log #${importLog.id} para FAILED:`, updateError);
      return res.status(500).json({ message: error.message || "Erro interno crítico." });
    }
  }
};

// --- NOVA FUNÇÃO DE PROCESSAMENTO (FLUXO A: POR UPLOAD/DROPZONE) ---
const handleUploadProcess = async (req, res) => {
  const user = req.user;
  // ======================= INÍCIO DA ALTERAÇÃO =======================
  const { dataSourceId, processingTarget } = req.body; // <-- 'processingTarget' ADICIONADO
  // ======================== FIM DA ALTERAÇÃO =========================
  const file = req.file;

  if (!user || !dataSourceId || !file) {
    return res.status(400).json({ message: "Dados incompletos (arquivo ou dataSourceId) para a importação." });
  }
  // ======================= INÍCIO DA ALTERAÇÃO =======================
  if (!processingTarget) {
     return res.status(400).json({ message: "O 'processingTarget' (alvo do processamento) é obrigatório." });
  }
  // ======================== FIM DA ALTERAÇÃO =========================

  const userIdInt = parseInt(user.id, 10);
  const dataSourceIdInt = parseInt(dataSourceId, 10);
  if (isNaN(userIdInt) || isNaN(dataSourceIdInt)){
    return res.status(400).json({ message: "ID de usuário ou Fonte de Dados inválido." });
  }

  let dataSource;
  try {
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    // 'include' atualizado para 'systemConfig'
    dataSource = await prisma.dataSource.findFirst({
      where: { id: dataSourceIdInt, userId: userIdInt },
      include: {
        hrConfig: true,
        idmConfig: true,
        systemConfig: { // <-- ATUALIZADO
          include: {
            system: true // Para pegar o systemId
          }
        },
        mappingRH: true,
        mappingIDM: true,
        mappingSystem: true,
      }
    });
    // ======================== FIM DA ALTERAÇÃO =========================
    if (!dataSource) {
      return res.status(404).json({ message: "Fonte de Dados não encontrada." });
    }
  } catch (e) {
    return res.status(500).json({ message: `Erro ao buscar configuração da Fonte de Dados: ${e.message}`});
  }

  const importLog = await prisma.importLog.create({
    data: { 
      fileName: file.originalname, // Nome do arquivo do upload
      status: "PENDING", 
      userId: userIdInt,
      dataSourceId: dataSourceIdInt 
    },
  });

  try {
    const { origem_datasource: origem } = dataSource;
    
    // ======================= INÍCIO DA ALTERAÇÃO (Switch Logic) =======================
    // Variáveis movidas para dentro do 'switch'
    
    let mapeamento = null;
    let rows = [];
    let processFunction = null; // Função de processamento a ser chamada
    let systemId = null; // Apenas para SISTEMA

    // Lê o conteúdo do arquivo do buffer (upload)
    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    rows = parsedCsv.data;
    if (rows.length === 0) {
      throw new Error("O arquivo CSV está vazio.");
    }
    
    switch (origem) {
      case "RH":
        if (!dataSource.mappingRH) throw new Error("Mapeamento (DataMappingRH) não encontrado.");
        if (!dataSource.hrConfig) throw new Error("Configuração de RH (HRConfig) não encontrada."); // (Upload precisa da config?)
        
        mapeamento = dataSource.mappingRH; 
        processFunction = (tx, rows) => processAndSaveData_RH(tx, dataSource.id, rows, mapeamento);
        break;

      case "IDM":
        throw new Error("Importação via Upload não suportada para IDM.");
        
      case "SISTEMA":
        if (!dataSource.systemConfig) throw new Error("Configuração de Sistema (SystemConfig) não encontrada.");
        if (!dataSource.systemConfig.system) throw new Error("Configuração de Sistema (SystemConfig) não está ligada a um Catálogo (System).");
        if (!dataSource.mappingSystem) throw new Error("Mapeamento (DataMappingSystem) não encontrado.");
        
        systemId = dataSource.systemConfig.systemId; // ID do Catálogo (ex: "SAP")
        mapeamento = dataSource.mappingSystem;
        
        if (processingTarget === "CONTAS") {
          if (dataSource.systemConfig.tipo_fonte_contas !== "CSV") {
            throw new Error("Processamento via upload só é suportado para tipo de fonte 'CSV'.");
          }
          processFunction = (tx, rows) => processAndSaveData_Contas(tx, systemId, rows, mapeamento);
          
        } else if (processingTarget === "RECURSOS") {
           if (dataSource.systemConfig.tipo_fonte_recursos !== "CSV") {
            throw new Error("Processamento via upload só é suportado para tipo de fonte 'CSV'.");
          }
          processFunction = (tx, rows) => processAndSaveData_Recursos(tx, systemId, rows, mapeamento);
          
        } else {
          throw new Error(`Alvo de processamento ('${processingTarget}') desconhecido para SISTEMA.`);
        }
        
        break;
        
      default:
        throw new Error("Origem de dados desconhecida.");
    }
    // ======================== FIM DA ALTERAÇÃO (Switch Logic) =========================

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length },
    });

    // Chama a lógica central correta (RH, Contas, ou Recursos)
    const { processedCount, warningsOrErrors } = await prisma.$transaction(async (tx) => {
      return processFunction(tx, rows);
    });

    // Finalização do Log
    const hasErrors = warningsOrErrors.some(msg => msg.includes("IGNORADA"));
    const finalStatus = hasErrors ? "FAILED" : "SUCCESS";
    const errorDetails = warningsOrErrors.length > 0
      ? `Processadas ${processedCount} de ${rows.length} linhas.\n${hasErrors ? 'Erros/Avisos' : 'Avisos'}:\n- ${warningsOrErrors.join('\n- ')}`
      : null;

    const finishedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: finalStatus, processedRows: processedCount, completedAt: new Date(), errorDetails: errorDetails },
      include: { user: { select: { name: true } }, dataSource: { select: { name_datasource: true } } },
    });

    return res.status(finalStatus === "SUCCESS" ? (warningsOrErrors.length > 0 ? 207 : 201) : 201).json(finishedLog);

  } catch (error) { // Erro GERAL
    console.error(`Falha CRÍTICA ao processar importação #${importLog.id}:`, error);
    try {
      const failedLog = await prisma.importLog.update({
        where: { id: importLog.id },
        data: { status: "FAILED", errorDetails: error.message, completedAt: new Date() },
        include: { user: { select: { name: true } }, dataSource: { select: { name_datasource: true } } },
      });
      return res.status(error.message.includes("não encontrado") ? 400 : 500).json(failedLog);
    } catch (updateError) {
      console.error(`Falha ao ATUALIZAR o log #${importLog.id} para FAILED:`, updateError);
      return res.status(500).json({ message: error.message || "Erro interno crítico." });
    }
  }
};


const deleteImportLog = async (req, res) => {
  const logId = parseInt(req.params.id, 10);
  if (isNaN(logId)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  const userIdInt = parseInt(req.user.id, 10);
  if (isNaN(userIdInt)) {
    return res.status(400).json({ message: "ID de usuário inválido." });
  }

  try {
    const deleteResult = await prisma.importLog.deleteMany({
        where: {
          id: logId,
          userId: userIdInt 
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

// --- 6. Definição das Rotas (Atualizado) ---
router.get("/", passport.authenticate("jwt", { session: false }), getImportHistory);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteImportLog);

// Rota para processar a partir de um diretório salvo (Fluxo B)
router.post("/process-directory", passport.authenticate("jwt", { session: false }), handleDirectoryProcess);

// Rota para processar a partir de um upload (Fluxo A)
router.post("/upload", passport.authenticate("jwt", { session: false }), upload.single("csvFile"), handleUploadProcess);

export default router;