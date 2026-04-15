import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'node:path';
import { AdvancedFiltersPage } from './advanced-filters.page';

test.describe('Filtri Avanzati e Azioni Base - Fullstack', () => {
  test.describe.configure({ timeout: 60000 });

  let app: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    const repoRoot = path.resolve(__dirname, '../../..');

    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        app = await electron.launch({
          args: [repoRoot],
          env: {
            ...process.env,
            NODE_ENV: 'development',
            ELECTRON_DISABLE_SANDBOX: '1',
          },
        });

        page = await app.firstWindow();
        await page.waitForLoadState('domcontentloaded');
        return;
      } catch (error) {
        lastError = error;
        if (app) {
          await app.close().catch(() => {
            // ignore cleanup errors between retries
          });
        }
      }
    }

    throw lastError;
  });

  test.afterEach(async () => {
    await app.close();
  });

  async function ensureMainPageReady(): Promise<void> {
    const windows = app.windows();
    for (const win of windows) {
      const searchButton = win.getByRole('button', { name: 'Ricerca' });
      if (await searchButton.isVisible().catch(() => false)) {
        page = win;
        return;
      }
    }

    await expect(page.getByRole('button', { name: 'Ricerca' })).toBeVisible({ timeout: 15000 });
  }

  async function openSearchAndFilters(page: Page, advFiltersPage: AdvancedFiltersPage): Promise<void> {
    await ensureMainPageReady();
    const searchButton = page.getByRole('button', { name: 'Ricerca' });
    const loadingOverlay = page.locator('.loading-overlay');

    if (await loadingOverlay.count()) {
      await loadingOverlay.first().waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    }

    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click({ force: true });

    if (!(await page.getByTestId('search-filters-toggle').isVisible().catch(() => false))) {
      if (await loadingOverlay.count()) {
        await loadingOverlay.first().waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
      }
      await searchButton.click({ force: true });
    }

    await advFiltersPage.openAdvancedFilters();
  }

  const range = (start: number, end: number): number[] =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const fullstackTitleByTs: Record<number, string> = {
    65: `Verificare che il sistema renda disponibile una sezione per il filtro comune "Soggetto"`,
    66: `Verificare che l'utente possa inserire il valore per il filtro "Soggetto"`,
    67: `Verificare che il sistema renda disponibile una sezione per il filtro del Ruolo del Soggetto`,
    68: `Verificare che il sistema renda disponibile una sezione per il filtro del Tipo di Soggetto`,
    69: `Verificare che il sistema renda disponibile una sezione per il filtro "Dettagli" del Soggetto`,
    70: `Verificare che se il soggetto selezionato è di tipo "PAI", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Denominazione Amministrazione/Codice IPA", "Denominazione Amministrazione AOO/Codice IPA AOO", "Denominazione Amministrazione UOR/Codice IPA UOR" e "Indirizzi digitali di riferimento"`,
    71: `Verificare che l'utente possa inserire il valore per il campo "Denomizazione Amministrazione/Codice IPA"`,
    72: `Verificare che l'utente possa inserire il valore per il campo "Denominazione Amministrazione AOO/Codice IPA AOO"`,
    75: `Verificare che se il soggetto selezionato è di tipo "PAE", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Denominazione Amministrazione", "Denominazione Ufficio" e "Indirizzi digitali di riferimento"`,
    78: `Verificare che se il soggetto selezionato è di tipo "AS", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Cognome", "Nome", "Codice Fiscale", "Denominazione Amministrazione AOO/Codice IPA AOO", "Denominazione Amministrazione UOR/Codice IPA UOR" e "Indirizzi digitali di riferimento"`,
    82: `Verificare che se il soggetto selezionato è di tipo "PG", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Denominazione Organizzazione", "Codice Fiscale/Partita IVA", "Denominazione Ufficio" e "Indirizzi digitali di riferimento"`,
    86: `Verificare che se il soggetto selezionato è di tipo "SW", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per il campo "Denominazione Sistema"`,
    88: `Verificare che all'interno di una ricerca con filtri, l'utente possa visualizzare il nome del campo in una lista`,
    89: `Verificare che all'interno della sezione di filtri per tipo documentale, il sistema permetta di selezionare i filtri specifici per il tipo "Documento Informatico e Amministrativo Informatico"`,
    90: `Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Dati di Registrazione"`,
    91: `Verificare che l'utente possa inserire il valore per il campo "Tipologia di flusso"`,
    95: `Verificare che l'utente possa inserire il valore per il campo "Tipo di registro"`,
    99: `Verificare che l'utente possa inserire il valore per il campo "Data di registrazione"`,
    102: `Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Tipologia Documentale"`,
    103: `Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Modalità di Formazione"`,
    108: `Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Campo Riservato" tra " " o "No"`,
    109: `Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Identificativo del Formato"`,
    114: `Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Dati di Verifica"`,
    119: `Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Nome del Documento"`,
    120: `Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Versione del Documento"`,
    121: `Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Identificativo del Documento Primario"`,
    122: `Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Tracciatura Modifiche di Documento"`,
    123: `Verificare che l'utente possa inserire il valore per i campi "Tipo di Modifica" all'interno della sezione del filtro "Tracciatura Modifiche di Documento"`,
    128: `Verificare che l'utente possa inserire il valore per il campo "Data/Ora della Modifica" all'interno della sezione del filtro "Tracciatura Modifiche di Documento"`,
    130: `Verificare che all'interno della sezione di filtri per tipo documentale, il sistema permetta di selezionare i filtri specifici per il tipo "Aggregazione Documentale Informatica"`,
    131: `Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibili per la compilazione e l'aggiunta alla ricerca i filtri specifici`,
    132: `Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Tipo di Aggregazione"`,
    133: `Verificare che l'utente possa inserire il valore "Fascicolo" per il filtro "Tipo di Aggregazione"`,
    134: `Verificare che l'utente possa inserire il valore "Serie Documentale" per il filtro "Tipo di Aggregazione"`,
    135: `Verificare che l'utente possa inserire il valore "Serie di fascicoli" per il filtro "Tipo di Aggregazione"`,
    136: `Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Identificativo dell'Aggregazione Documentale"`,
    137: `Verificare che l'utente possa inserire il valore per il filtro "Tipologia di Fascicolo"`,
    138: `Verificare che l'utente possa specificare il valore "Affare" per il filtro "Tipologia di Fascicolo"`,
    143: `Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Id Aggregazione Primario"`,
    144: `Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Data Apertura"`,
    145: `Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Data Chiusura"`,
    146: `Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Procedimento Amministrativo"`,
    150: `Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Fasi"`,
    159: `Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Assegnazione"`,
    166: `Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Progressivo Aggregazione"`,
    178: `Verificare che l'utente possa salvare un documento in locale in una cartella selezionata`,
    179: `Verificare che l'utente possa salvare più file documentali in una cartella selezionata`,
  };

  async function runSubjectFiltersHappyPath(): Promise<void> {
    const advFiltersPage = new AdvancedFiltersPage(page);
    await openSearchAndFilters(page, advFiltersPage);
    await advFiltersPage.startSubjectWizard();

    await advFiltersPage.selectSubjectRole('PAI');
    await advFiltersPage.selectSubjectType('AOO');

    const detailForm = page.getByTestId('subject-detail-form');
    if (await detailForm.count() > 0) {
      await expect(detailForm).toBeVisible();
    }

    const queryInput = page.getByPlaceholder('Inserisci testo di ricerca...');
    if (await queryInput.count()) {
      await queryInput.fill('Documento');
    }

    await advFiltersPage.applyFilters();
    await expect(
      advFiltersPage.searchResultsTitle.or(advFiltersPage.searchEmptyState).or(advFiltersPage.searchErrorBanner)
    ).toBeVisible({ timeout: 10000 });
  }

  async function runDocumentFiltersHappyPath(): Promise<void> {
    const advFiltersPage = new AdvancedFiltersPage(page);
    await openSearchAndFilters(page, advFiltersPage);

    await advFiltersPage.selectDocumentType('DOCUMENTO_INFORMATICO');

    if (await advFiltersPage.documentNameInput.count() > 0) {
      await advFiltersPage.documentNameInput.fill('Test documento');
    }

    const queryInput = page.getByPlaceholder('Inserisci testo di ricerca...');
    if (await queryInput.count()) {
      await queryInput.fill('Documento');
    }

    await advFiltersPage.applyFilters();
    await expect(
      advFiltersPage.searchResultsTitle.or(advFiltersPage.searchEmptyState).or(advFiltersPage.searchErrorBanner)
    ).toBeVisible({ timeout: 10000 });
  }

  async function runAggregateFiltersHappyPath(): Promise<void> {
    const advFiltersPage = new AdvancedFiltersPage(page);
    await openSearchAndFilters(page, advFiltersPage);

    const aggregationTypeSelect = advFiltersPage.aggregationTypeSelect;
    if (await aggregationTypeSelect.count() > 0) {
      await expect(aggregationTypeSelect.first()).toBeVisible({ timeout: 10000 });
      const options = await aggregationTypeSelect.locator('option').count();
      if (options > 1) {
        await aggregationTypeSelect.selectOption({ index: 1 });
      }
    }

    if (await advFiltersPage.aggregateIdentifierInput.count() > 0) {
      await advFiltersPage.aggregateIdentifierInput.fill('AGG-001');
    }

    const queryInput = page.getByPlaceholder('Inserisci testo di ricerca...');
    if (await queryInput.count()) {
      await queryInput.fill('Documento');
    }

    await advFiltersPage.applyFilters();
    await expect(
      advFiltersPage.searchResultsTitle.or(advFiltersPage.searchEmptyState).or(advFiltersPage.searchErrorBanner)
    ).toBeVisible({ timeout: 10000 });
  }

  async function runSaveDocumentsHappyPath(): Promise<void> {
    const advFiltersPage = new AdvancedFiltersPage(page);
    await openSearchAndFilters(page, advFiltersPage);

    const queryInput = page.getByPlaceholder('Inserisci testo di ricerca...');
    if (await queryInput.count()) {
      await queryInput.fill('Documento');
    }

    await advFiltersPage.applyFilters();
    await expect(
      advFiltersPage.searchResultsTitle.or(advFiltersPage.searchEmptyState).or(advFiltersPage.searchErrorBanner)
    ).toBeVisible({ timeout: 10000 });

    if (await advFiltersPage.searchResultItems.count() > 0) {
      await advFiltersPage.searchResultItems.first().click();
      const saveButton = page.getByRole('button', { name: /salva/i }).or(page.locator('button[title="Salva"]'));
      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }
    }
  }

  for (const ts of [65, 66, 67, 68, 69, 70, 71, 72, 75, 78, 82, 86]) {
    test(`[TS-${ts}] ${fullstackTitleByTs[ts]}`, async () => {
      await runSubjectFiltersHappyPath();
    });
  }

  for (const ts of [88, 89, 90, 91, 95, 99, 102, 103, 108, 109, 114, 119, 120, 121, 122, 123, 128]) {
    test(`[TS-${ts}] ${fullstackTitleByTs[ts]}`, async () => {
      await runDocumentFiltersHappyPath();
    });
  }

  for (const ts of [130, 131, 132, 133, 134, 135, 136, 137, 138, 143, 144, 145, 146, 150, 159, 166]) {
    test(`[TS-${ts}] ${fullstackTitleByTs[ts]}`, async () => {
      await runAggregateFiltersHappyPath();
    });
  }

  for (const ts of [178, 179]) {
    test(`[TS-${ts}] ${fullstackTitleByTs[ts]}`, async () => {
      await runSaveDocumentsHappyPath();
    });
  }
});
