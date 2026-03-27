#!/usr/bin/env node

/**
 * Script per scaricare i modelli ONNX quantizzati da Hugging Face
 * 
 * Scarica il modello paraphrase-multilingual-MiniLM-L12-v2 nella cartella
 * assets/models/Xenova/paraphrase-multilingual-MiniLM-L12-v2/onnx
 */

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Colori per l'output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

interface ModelFile {
  url: string;
  filename: string;
}

interface Model {
  name: string;
  files: ModelFile[];
}

// Modelli da scaricare con i loro URL
const MODELS: Model[] = [
  {
    name: 'paraphrase-multilingual-MiniLM-L12-v2',
    files: [
      {
        url: 'https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/resolve/main/onnx/model_quantized.onnx?download=true',
        filename: 'model_quantized.onnx',
      },
    ],
  },
];

/**
 * Scarica un file da un URL e lo salva nel percorso specificato
 */
function downloadFile(url: string, targetPath: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(targetPath, filename);
    const protocol = url.startsWith('https') ? https : http;

    console.log(`${colors.blue}⬇ Scaricamento: ${filename}${colors.reset}`);

    const file = fs.createWriteStream(fullPath);
    
    protocol
      .get(url, { maxRedirects: 5 } as any, (response) => {
        // Gestione dei reindirizzamenti
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.destroy();
          downloadFile(response.headers.location, targetPath, filename)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.destroy();
          fs.unlink(fullPath, () => {}); // Cancella il file parziale
          reject(new Error(`Errore HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        // Mostra la progress della scaricamento
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(
            `\r${colors.blue}${filename}: ${(downloadedSize / 1024 / 1024).toFixed(1)} MB / ${(totalSize / 1024 / 1024).toFixed(1)} MB (${percent}%)${colors.reset}`
          );
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`\n${colors.green}✓ Download completato: ${filename}${colors.reset}`);
          resolve(fullPath);
        });

        file.on('error', (err) => {
          file.close();
          fs.unlink(fullPath, () => {}); // Cancella il file parziale
          reject(err);
        });
      })
      .on('error', reject);
  });
}

/**
 * Crea la struttura di cartelle necessaria
 */
function ensureDirectories() {
  const baseDir = path.join(process.cwd(), 'core', 'src', 'models', 'Xenova');

  for (const model of MODELS) {
    const modelDir = path.join(baseDir, model.name, 'onnx');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
      console.log(`${colors.green}✓ Cartella creata: ${modelDir}${colors.reset}`);
    }
  }

  return baseDir;
}

/**
 * Main: esegui il download dei modelli
 */
async function main(): Promise<void> {
  console.log(`${colors.yellow}🤖 Inizio download dei modelli ONNX...${colors.reset}\n`);

  try {
    const baseDir = ensureDirectories();

    for (const model of MODELS) {
      console.log(`${colors.blue}\n📦 Elaborazione modello: ${model.name}${colors.reset}`);

      const modelOnnxDir = path.join(baseDir, model.name, 'onnx');

      for (const file of model.files) {
        // Controlla se il file esiste già
        const fullPath = path.join(modelOnnxDir, file.filename);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
          console.log(`${colors.yellow}⊘ File già presente: ${file.filename} (${sizeInMB} MB)${colors.reset}`);
          continue;
        }

        await downloadFile(file.url, modelOnnxDir, file.filename);
      }
    }

    console.log(`\n${colors.green}✅ Download completato con successo!${colors.reset}`);
    console.log(`${colors.blue}I modelli sono disponibili in: assets/models/Xenova/${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}❌ Errore durante il download: ${(error as Error).message}${colors.reset}`);
    process.exit(1);
  }
}

main();
