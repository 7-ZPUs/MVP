// npx playwright test --reporter=json > test-results.json Per eseguire i test e generare il file di input

const fs = require('fs');

// --- CONFIGURAZIONE ---
const maxTSNumber = 379;
const inputFile = 'test-results.json';
const outputFile = 'coverage-report.md';
// ----------------------

console.log(`Caricamento risultati da ${inputFile}...`);

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Errore: Il file ${inputFile} non esiste.`);
  console.error('Esegui prima i test con: npx playwright test --reporter=json > test-results.json');
  process.exit(1);
}

const rawData = fs.readFileSync(inputFile, 'utf-8');
const testData = JSON.parse(rawData);

// Inizializza la mappa delle coperture (TS-1 fino a TS-379)
const expectedTests = Array.from({ length: maxTSNumber }, (_, i) => `TS-${i + 1}`);
const tsCoverage = {};
for (const ts of expectedTests) {
  tsCoverage[ts] = [];
}

// Regex per trovare "TS-X" (inclusi i numeri estratti dinamicamente dai cicli for)
const tsIdRegex = /TS-(\d+)/g;

// Funzione ricorsiva per navigare la struttura JSON di Playwright
// (testData.suites -> suite figlie -> specs)
function processSuites(suites) {
  if (!suites) return;
  
  suites.forEach(suite => {
    // Se ci sono specifiche (i singoli "test()"), analizza i titoli
    if (suite.specs) {
      suite.specs.forEach(spec => {
        const hasPassingITest = Array.isArray(spec.tests)
          && spec.tests.some(test => {
            if (!Array.isArray(test.results) || test.results.length === 0) return false;
            const finalResult = test.results[test.results.length - 1];
            return finalResult.status === 'passed';
          });

        // Conta copertura solo per i test che passano realmente.
        if (!hasPassingITest) {
          return;
        }

        const title = spec.title;
        const file = spec.file.split('/').pop(); // Estrae solo il nome del file
        
        let match;
        const detectedTsIds = new Set(); // Usa un Set per evitare duplicati nello stesso test
        
        while ((match = tsIdRegex.exec(title)) !== null) {
          detectedTsIds.add(`TS-${match[1]}`);
        }

        // Aggiunge il test trovato alla copertura
        detectedTsIds.forEach(tsId => {
          if (tsCoverage[tsId]) {
            tsCoverage[tsId].push({ file, title });
          }
        });
      });
    }
    
    // Scende nei blocchi test.describe() annidati
    if (suite.suites) {
      processSuites(suite.suites);
    }
  });
}

// Avvia l'estrazione
processSuites(testData.suites);

// --- GENERAZIONE REPORT MARKDOWN ---
let report = '# 📊 Report Copertura Test di Sistema (TS-1 → TS-379)\n\n';

let stats = { missing: 0, single: 0, multiple: 0 };
let tableRows = '';

for (const ts of expectedTests) {
  const locations = tsCoverage[ts];
  
  if (locations.length === 0) {
    tableRows += `| **${ts}** | ❌ Mancante | - |\n`;
    stats.missing++;
  } else if (locations.length === 1) {
    tableRows += `| **${ts}** | ✅ Coperto | \`${locations[0].file}\`<br>_"${locations[0].title}"_ |\n`;
    stats.single++;
  } else {
    const formattedLocations = locations
      .map(loc => `\`${loc.file}\`<br>_"${loc.title}"_`)
      .join('<br><hr>');
      
    tableRows += `| **${ts}** | ⚠️ Multiplo (${locations.length}x) | ${formattedLocations} |\n`;
    stats.multiple++;
  }
}

const totalCovered = stats.single + stats.multiple;
const progress = ((totalCovered / maxTSNumber) * 100).toFixed(2);

report += `### 📝 Sommario\n`;
report += `- ✅ Singola Copertura: **${stats.single}**\n`;
report += `- ⚠️ Copertura Multipla: **${stats.multiple}**\n`;
report += `- ❌ Mancanti: **${stats.missing}**\n`;
report += `- 🎯 Progresso Globale: **${progress}%**\n\n`;

report += '| ID Test | Stato | Posizioni (File e Titolo) |\n';
report += '|---|---|---|\n';
report += tableRows;

// Salvataggio su file
fs.writeFileSync(outputFile, report, 'utf-8');
console.log(`✅ Report generato con successo: ${outputFile}`);
console.log(`🎯 Copertura totale: ${progress}%`);

// Supporto per GitHub Actions (Stampa nel summary della pipeline se disponibile)
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
}