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
        dataSource: { 
          select: { 
            name_datasource: true,
            systemConfig: {
              select: {
                systemId: true
              }
            }
          } 
        } 
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
    
    // 4. Validação de Campos Obrigatórios (RH)
    const requiredFields = ['identity_id_hr', 'email_hr', 'status_hr'];
    const missingFields = [];
    
    for (const field of requiredFields) {
        if (!dataToSave[field]) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Campos obrigatórios não mapeados ou vazios: [${missingFields.join(', ')}].`);
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
 * Processa e salva dados de CONTAS (SISTEMA) e suas ATRIBUIÇÕES
 */
const processAndSaveData_Contas = async (tx, systemId, rows, mapeamento, resourceCache) => {
  let processedCount = 0; // Contas processadas
  let assignmentsCreatedCount = 0; // Atribuições criadas
  const warningsOrErrors = [];
  
  // 1. Limpa os dados antigos (Assignments E Accounts) deste sistema
  await tx.assignment.deleteMany({
    where: { account: { systemId: systemId } }
  });
  await tx.accounts.deleteMany({ 
    where: { systemId: systemId } 
  });

  // 2. Pré-busca de Recursos (REMOVIDO - Agora vem como argumento)
  if (resourceCache.size === 0) {
    warningsOrErrors.push("AVISO GERAL: Nenhum Recurso foi encontrado no catálogo para este sistema. Nenhuma atribuição será criada.");
  }

  // 3. Processa cada linha do CSV
  for (const [index, csvRow] of rows.entries()) {
    const linhaNum = index + 2; 
    const dataToSave = {};
    let identityBusinessKey = null; // O ID do RH (ex: "MAT123")
    let resourceNamesString = null; // A string de recursos (ex: '"role1";"role2"')

    // 4. O "TRADUTOR"
    for (const [dbColumn, csvColumn] of Object.entries(mapeamento)) {
      if (!dbColumn.startsWith("accounts_") || !csvColumn || csvRow[csvColumn] === undefined) {
        continue;
      }
      
      let appColumn;
      switch (dbColumn) {
        // Chaves Especiais (não vão para o dataToSave)
        case "accounts_identity_id":
          identityBusinessKey = csvRow[csvColumn];
          continue;
        case "accounts_resource_name":
          resourceNamesString = csvRow[csvColumn];
          continue;
          
        // Mapeamento Direto
        case "accounts_id_in_system":
          appColumn = "id_in_system_account";
          break;
        case "accounts_name":
          appColumn = "name_account";
          break;
        case "accounts_email":
          appColumn = "email_account";
          break;

// ======================= INÍCIO DA ALTERAÇÃO =======================
        case "accounts_cpf":
          appColumn = "cpf_account"; // Mapeia para a nova coluna do schema
          break;
// ======================== FIM DA ALTERAÇÃO =========================

        case "accounts_status":
          appColumn = "status_account";
          break;
        default:
          appColumn = dbColumn.replace("accounts_", "");
      }
      dataToSave[appColumn] = csvRow[csvColumn];
    }
    
// ================== LOG DE DEBUG 2 (String Bruta) ==================
    console.log(`[Linha ${linhaNum}] String de Recursos (Bruta): '${resourceNamesString}'`);
// ===================================================================

    // 5. Validação de Campos Obrigatórios (Contas)
    const missingFields = [];
    if (!dataToSave['id_in_system_account']) missingFields.push('accounts_id_in_system');
    if (!dataToSave['email_account']) missingFields.push('accounts_email');
    if (!identityBusinessKey) missingFields.push('accounts_identity_id');
    
    if (missingFields.length > 0) {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Campos obrigatórios da Conta não mapeados ou vazios: [${missingFields.join(', ')}].`);
        continue;
    }
    
    try {
      // 6. Busca a Identidade (ex: "MAT123") para encontrar a PK (ex: 42)
      const identity = await tx.identitiesHR.findUnique({
        where: { identity_id_hr: identityBusinessKey }
      });
      
      if (!identity) {
         warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - A Identidade com ID RH '${identityBusinessKey}' não foi encontrada na tabela 'IdentitiesHR'.`);
         continue;
      }
      
      // 7. Cria ou Atualiza a CONTA
      dataToSave.systemId = systemId; 
      dataToSave.identityId = identity.id;
      
      const account = await tx.accounts.upsert({
        where: { id_in_system_account: dataToSave.id_in_system_account },
        update: dataToSave,
        create: dataToSave,
      });
      processedCount++; // Conta como 1 conta processada
      
      // 8. Processa as ATRIBUIÇÕES (Loop Interno)
      if (resourceNamesString) {
        // PASSO 1: Divide a string por ponto e vírgula
        const resourceNamesArray = resourceNamesString.split(';');
        
        // PASSO 2: Limpa (trim e remove aspas) CADA item e filtra itens vazios
        const cleanedNames = resourceNamesArray
          .map(r => r.replace(/"/g, '').trim()) // Limpa aspas E espaços
          .filter(Boolean); // Remove strings vazias (ex: "" ou " ")
        
        // PASSO 3: Remove duplicatas da mesma linha
        const uniqueResourceNames = [...new Set(cleanedNames)];

// ================== LOG DE DEBUG 3 (Array Limpo) ===================
        console.log(`[Linha ${linhaNum}] Nomes de Recursos (Limp_os e Únicos):`, uniqueResourceNames);
// ===================================================================

        for (const resourceName of uniqueResourceNames) {
          const resourceId = resourceCache.get(resourceName); // Busca no cache

// ================== LOG DE DEBUG 4 (Lookup no Cache) ================
          console.log(`[Linha ${linhaNum}] Buscando Recurso: '${resourceName}' | Encontrado ID:`, resourceId);
// ===================================================================
          
          if (resourceId) {
            // Cria a entrada na tabela de relacionamento
            await tx.assignment.create({
              data: {
                accountId: account.id,
                resourceId: resourceId,
              }
            });
            assignmentsCreatedCount++;
          } else {
            warningsOrErrors.push(`Linha ${linhaNum}: AVISO - O recurso '${resourceName}' não foi encontrado no catálogo e não foi atribuído.`);
          }
        }
      }
      
    } catch (dbError) {
      if (dbError.code === 'P2002') { // Violação de constraint única
        const target = dbError.meta?.target || [];
        if (target.includes('accountId') && target.includes('resourceId')) {
            warningsOrErrors.push(`Linha ${linhaNum}: AVISO - Atribuição duplicada ignorada.`);
        } else {
            warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Violação de constraint única da Conta (${target.join(', ')}).`);
        }
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

    // 3. O "TRADUTOR" (CORRIGIDO)
    for (const [dbColumn, csvColumn] of Object.entries(mapeamento)) {
      // Filtra apenas chaves de Recursos
      if (dbColumn.startsWith("resources_") && csvColumn && csvRow[csvColumn] !== undefined) {
        
        let appColumn;
        // Faz a tradução correta dos campos do Mapeamento para o Schema
        switch (dbColumn) {
          case "resources_name":
            appColumn = "name_resource"; // Schema usa name_resource
            break;
          case "resources_description":
            appColumn = "description_resource"; // Schema usa description_resource
            break;
          default:
            // Converte 'resources_permissions' -> 'permissions'
            appColumn = dbColumn.replace("resources_", "");
        }
    
        dataToSave[appColumn] = csvRow[csvColumn];
      }
    }
    
    // 4. Validação de Campos Obrigatórios (Recursos)
    const missingFields = [];
    if (!dataToSave['name_resource']) missingFields.push('resources_name');
    if (!dataToSave['permissions']) missingFields.push('resources_permissions');

    if (missingFields.length > 0) {
        warningsOrErrors.push(`Linha ${linhaNum}: IGNORADA - Campos obrigatórios não mapeados ou vazios: [${missingFields.join(', ')}].`);
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
  const { dataSourceId, processingTarget } = req.body; 

  if (!user || !dataSourceId) {
    return res.status(400).json({ message: "Dados incompletos para a importação." });
  }
  if (!processingTarget) {
     return res.status(400).json({ message: "O 'processingTarget' (alvo do processamento) é obrigatório." });
  }

  const userIdInt = parseInt(user.id, 10);
  const dataSourceIdInt = parseInt(dataSourceId, 10);
  if (isNaN(userIdInt) || isNaN(dataSourceIdInt)){
    return res.status(400).json({ message: "ID de usuário ou Fonte de Dados inválido." });
  }

  let dataSource;
  try {
    dataSource = await prisma.dataSource.findFirst({
      where: { id: dataSourceIdInt, userId: userIdInt },
      include: {
        hrConfig: true,
        idmConfig: true,
        systemConfig: { 
          include: {
            system: true 
          }
        },
        mappingRH: true,
        mappingIDM: true,
        mappingSystem: true,
      }
    });
    if (!dataSource) {
      return res.status(404).json({ message: "Fonte de Dados não encontrada." });
    }
  } catch (e) {
    return res.status(500).json({ message: `Erro ao buscar configuração da Fonte de Dados: ${e.message}`});
  }

  // Determina qual alvo será salvo no log
  const logTarget = dataSource.origem_datasource === 'SISTEMA' 
    ? processingTarget 
    : dataSource.origem_datasource; // Salva "RH" ou "IDM"

  const importLog = await prisma.importLog.create({
    data: { 
      fileName: `Processamento (Diretório) - ${dataSource.name_datasource}`, 
      status: "PENDING", 
      userId: userIdInt,
      dataSourceId: dataSourceIdInt,
      processingTarget: logTarget // <-- ADICIONADO
    },
  });

  try {
    const { origem_datasource: origem } = dataSource;
    
    let diretorio = null;
    let mapeamento = null;
    let rows = [];
    let csvFileName = `Processamento - ${dataSource.name_datasource}`;
    let processFunction = null; 
    let systemId = null; 
    
    let resourceCache = new Map(); 
    
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
        
        systemId = dataSource.systemConfig.systemId; 
        mapeamento = dataSource.mappingSystem;
        
        if (processingTarget === "CONTAS") {
          diretorio = dataSource.systemConfig.diretorio_contas;
          if (dataSource.systemConfig.tipo_fonte_contas !== "CSV") {
            throw new Error("Processamento via diretório só é suportado para tipo de fonte 'CSV'.");
          }
          // Constrói o cache ANTES de chamar a transação
          const resources = await prisma.resource.findMany({
            where: { systemId: systemId },
            select: { id: true, name_resource: true }
          });
          resourceCache = new Map(resources.map(r => [r.name_resource.trim(), r.id]));
// ================== LOG DE DEBUG 1 (Cache) =========================
          console.log("CACHE DE RECURSOS CONSTRUÍDO (Diretório):", resourceCache);
// ===================================================================
          // Passa o cache como argumento
          processFunction = (tx, rows) => processAndSaveData_Contas(tx, systemId, rows, mapeamento, resourceCache);
          
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

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length, fileName: csvFileName },
    });

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
  const { dataSourceId, processingTarget } = req.body; 
  const file = req.file;

  if (!user || !dataSourceId || !file) {
    return res.status(400).json({ message: "Dados incompletos (arquivo ou dataSourceId) para a importação." });
  }
  if (!processingTarget) {
     return res.status(400).json({ message: "O 'processingTarget' (alvo do processamento) é obrigatório." });
  }

  const userIdInt = parseInt(user.id, 10);
  const dataSourceIdInt = parseInt(dataSourceId, 10);
  if (isNaN(userIdInt) || isNaN(dataSourceIdInt)){
    return res.status(400).json({ message: "ID de usuário ou Fonte de Dados inválido." });
  }

  let dataSource;
  try {
    dataSource = await prisma.dataSource.findFirst({
      where: { id: dataSourceIdInt, userId: userIdInt },
      include: {
        hrConfig: true,
        idmConfig: true,
        systemConfig: { 
          include: {
            system: true 
          }
        },
        mappingRH: true,
        mappingIDM: true,
        mappingSystem: true,
      }
    });
    if (!dataSource) {
      return res.status(404).json({ message: "Fonte de Dados não encontrada." });
    }
  } catch (e) {
    return res.status(500).json({ message: `Erro ao buscar configuração da Fonte de Dados: ${e.message}`});
  }

  // Determina qual alvo será salvo no log
  const logTarget = dataSource.origem_datasource === 'SISTEMA' 
    ? processingTarget 
    : dataSource.origem_datasource; // Salva "RH" ou "IDM"

  const importLog = await prisma.importLog.create({
    data: { 
      fileName: file.originalname, 
      status: "PENDING", 
      userId: userIdInt,
      dataSourceId: dataSourceIdInt,
      processingTarget: logTarget // <-- ADICIONADO
    },
  });

  try {
    const { origem_datasource: origem } = dataSource;
    
    let mapeamento = null;
    let rows = [];
    let processFunction = null; 
    let systemId = null; 
    
    let resourceCache = new Map(); 

    const fileContent = file.buffer.toString("utf8");
    const parsedCsv = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    rows = parsedCsv.data;
    if (rows.length === 0) {
      throw new Error("O arquivo CSV está vazio.");
    }
    
    switch (origem) {
      case "RH":
        if (!dataSource.mappingRH) throw new Error("Mapeamento (DataMappingRH) não encontrado.");
        if (!dataSource.hrConfig) throw new Error("Configuração de RH (HRConfig) não encontrada."); 
        
        mapeamento = dataSource.mappingRH; 
        processFunction = (tx, rows) => processAndSaveData_RH(tx, dataSource.id, rows, mapeamento);
        break;

      case "IDM":
        throw new Error("Importação via Upload não suportada para IDM.");
        
      case "SISTEMA":
        if (!dataSource.systemConfig) throw new Error("Configuração de Sistema (SystemConfig) não encontrada.");
        if (!dataSource.systemConfig.system) throw new Error("Configuração de Sistema (SystemConfig) não está ligada a um Catálogo (System).");
        if (!dataSource.mappingSystem) throw new Error("Mapeamento (DataMappingSystem) não encontrado.");
        
        systemId = dataSource.systemConfig.systemId; 
        mapeamento = dataSource.mappingSystem;
        
        if (processingTarget === "CONTAS") {
          if (dataSource.systemConfig.tipo_fonte_contas !== "CSV") {
            throw new Error("Processamento via upload só é suportado para tipo de fonte 'CSV'.");
          }
          // Constrói o cache ANTES de chamar a transação
          const resources = await prisma.resource.findMany({
            where: { systemId: systemId },
            select: { id: true, name_resource: true }
          });
          resourceCache = new Map(resources.map(r => [r.name_resource.trim(), r.id]));
// ================== LOG DE DEBUG 1 (Cache) =========================
          console.log("CACHE DE RECURSOS CONSTRUÍDO (Upload):", resourceCache);
// ===================================================================
          // Passa o cache como argumento
          processFunction = (tx, rows) => processAndSaveData_Contas(tx, systemId, rows, mapeamento, resourceCache);
          
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

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { status: "PROCESSING", totalRows: rows.length },
    });

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