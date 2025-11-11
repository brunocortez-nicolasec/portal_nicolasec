// node-api/src/services/datasources/testCsv.js

import fs from 'fs';
import readline from 'readline';
// ======================= INÍCIO DA ALTERAÇÃO =======================
import path from 'path';
// ======================== FIM DA ALTERAÇÃO =========================

// ======================= INÍCIO DA ALTERAÇÃO =======================
// --- Helper para encontrar o arquivo CSV único no diretório ---
const findSingleCsvInDir = async (directoryPath) => {
  const basePath = process.cwd();
  const absolutePath = path.resolve(basePath, directoryPath);

  let stats;
  try {
    stats = await fs.promises.stat(absolutePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`DIR_NOT_FOUND: O diretório '${directoryPath}' não foi encontrado.`);
    }
    throw err;
  }

  if (!stats.isDirectory()) {
    throw new Error(`NOT_A_DIRECTORY: O caminho '${directoryPath}' não é um diretório.`);
  }

  const files = await fs.promises.readdir(absolutePath);
  const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));

  if (csvFiles.length === 0) {
    throw new Error("NO_CSV_FOUND: Nenhum arquivo CSV (.csv) encontrado no diretório.");
  }
  if (csvFiles.length > 1) {
    throw new Error(`MULTIPLE_CSV_FOUND: Múltiplos arquivos CSV encontrados (${csvFiles.join(', ')}). O diretório deve conter apenas um.`);
  }

  // Retorna o caminho completo para o *arquivo* encontrado
  return path.join(absolutePath, csvFiles[0]);
};
// ======================== FIM DA ALTERAÇÃO =========================


export const testCsvConnection = async (req, res) => {
  const { diretorio } = req.body;

  if (!diretorio) {
    return res.status(400).json({ message: "O 'diretorio' (pasta) é obrigatório." });
  }

  try {
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    // 1. Encontra o caminho exato do arquivo CSV dentro da pasta
    const csvFilePath = await findSingleCsvInDir(diretorio);

    // 2. Cria um stream para ler apenas a primeira linha *do arquivo encontrado*
    const fileStream = fs.createReadStream(csvFilePath);
    // ======================== FIM DA ALTERAÇÃO =========================

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    // 3. Pega a primeira linha e fecha o stream
    let firstLine = null;
    for await (const line of rl) {
      firstLine = line;
      break; 
    }
    rl.close();
    fileStream.close();

    if (firstLine) {
      return res.status(200).json({ success: true, header: firstLine });
    } else {
      return res.status(400).json({ message: "O arquivo CSV encontrado está vazio." });
    }

  } catch (error) {
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    // 4. Captura os novos erros do helper
    if (error.message.startsWith('DIR_NOT_FOUND') || error.message.startsWith('NOT_A_DIRECTORY')) {
      return res.status(404).json({ message: error.message.split(': ')[1] });
    }
    if (error.message.startsWith('NO_CSV_FOUND') || error.message.startsWith('MULTIPLE_CSV_FOUND')) {
      return res.status(400).json({ message: error.message.split(': ')[1] });
    }
    // ======================== FIM DA ALTERAÇÃO =========================
    
    // Erros antigos de leitura de arquivo (ainda válidos)
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: "Arquivo não encontrado no caminho especificado." });
    }
    if (error.code === 'EACCES') {
      return res.status(403).json({ message: "Sem permissão para ler o arquivo no servidor." });
    }
    console.error("Erro ao testar CSV:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};