const fs = require('fs');
const path = require('path');

// --- CONFIGURAZIONE ---
const testDir = './e2e/electron/'; 
const testFilePattern = /\.spec\.ts$/; 
const maxTSNumber = 309; 
// ----------------------

const expectedTests = Array.from({ length: maxTSNumber }, (_, i) => `TS-${i + 1}`);
const tsCoverage = {};
for (const ts of expectedTests) {
  tsCoverage[ts] = [];
}

/**
 * Regex per il nuovo stile:
 * 1. itRegex: Cattura it o test (inclusi test.describe, test.fixme, ecc.)
 */
const itRegex = /(?:it|test|test\.\w+)\s*\(\s*(['"`])(.*?)\1/g;

/**
 * Regex per identificare i TS:
 * 1. Range: TS-1..TS-5
 * 2. Singoli: TS-10
 */
const tsRangeRegex = /TS-(\d+)\.\.TS-(\d+)/g;
const tsIdRegex = /TS-(\d+)/g;

function findTestFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
        findTestFiles(filePath, fileList);
      }
    } else if (testFilePattern.test(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const testFiles = findTestFiles(testDir);

for (const file of testFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  
  while ((match = itRegex.exec(content)) !== null) {
    const testTitle = match[2]; 
    const detectedTsIds = new Set();

    // 1. Gestione Range (es. TS-32..TS-34)
    let rangeMatch;
    while ((rangeMatch = tsRangeRegex.exec(testTitle)) !== null) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) {
        detectedTsIds.add(`TS-${i}`);
      }
    }

    // 2. Gestione Singoli (es. TS-45)
    let tsMatch;
    while ((tsMatch = tsIdRegex.exec(testTitle)) !== null) {
      detectedTsIds.add(`TS-${tsMatch[1]}`);
    }

    // Salvataggio copertura
    detectedTsIds.forEach(tsId => {
      if (tsCoverage[tsId]) {
        tsCoverage[tsId].push({ file, title: testTitle });
      }
    });
  }
}

// Creazione del report Markdown
let report = '## 📊 Report Copertura Test di Sistema (TS-1 → TS-309)\n\n';
report += '| ID Test | Stato | Posizioni (File e Titolo) |\n';
report += '|---|---|---|\n';

let stats = { missing: 0, single: 0, multiple: 0 };

for (const ts of expectedTests) {
  const locations = tsCoverage[ts];
  
  if (locations.length === 0) {
    report += `| **${ts}** | ❌ Mancante | N/A |\n`;
    stats.missing++;
  } else if (locations.length === 1) {
    report += `| **${ts}** | ✅ Coperto | \`${locations[0].file}\` <br> _"${locations[0].title}"_ |\n`;
    stats.single++;
  } else {
    const formattedLocations = locations
      .map(loc => `\`${loc.file}\` <br> _"${loc.title}"_`)
      .join('<br><br> --- <br><br>');
      
    report += `| **${ts}** | ⚠️ Multiplo (${locations.length}x) | ${formattedLocations} |\n`;
    stats.multiple++;
  }
}

const totalCovered = stats.single + stats.multiple;
const progress = ((totalCovered / maxTSNumber) * 100).toFixed(2);

report += `\n### 📝 Sommario\n`;
report += `- ✅ Singola Copertura: **${stats.single}**\n`;
report += `- ⚠️ Copertura Multipla: **${stats.multiple}**\n`;
report += `- ❌ Mancanti: **${stats.missing}**\n`;
report += `- 🎯 Progresso Globale: **${progress}%**\n\n`;

console.log(report);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
}