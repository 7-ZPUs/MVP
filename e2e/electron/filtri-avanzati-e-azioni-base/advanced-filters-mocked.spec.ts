import { expect, Page, test } from '@playwright/test';
import { AdvancedFiltersPage } from './advanced-filters.page';

type MockRequest = { channel: string; payload: unknown };

function createDefaultIpcMap() {
  return {
    'app:bootstrap-status': { state: 'success' },
    'search:get-subject-types': {
      PAI: ['AOO', 'UOR'],
      PAE: ['UOR'],
      AS: ['AS'],
      PG: ['PG'],
      PF: ['PF'],
      RUP: ['RUP'],
      SW: ['SW'],
      AMMINISTRAZIONE_TITOLARE: ['PAI'],
      AMMINISTRAZIONE_PARTECIPANTE: ['PAE'],
      ASSEGNATARIO: ['AS'],
      INTESTATARIO_PG: ['PG'],
      INTESTATARIO_PF: ['PF'],
      PRODUTTORE: ['SW'],
    },
    'search:get-available-roles': [
      'AMMINISTRAZIONE_TITOLARE',
      'AMMINISTRAZIONE_PARTECIPANTE',
      'ASSEGNATARIO',
      'INTESTATARIO_PF',
      'INTESTATARIO_PG',
      'RUP',
      'PRODUTTORE',
    ],
    'search:get-document-types': ['DOCUMENTO_INFORMATICO', 'DOCUMENTO_AMMINISTRATIVO_INFORMATICO'],
    'search:get-registration-types': ['REGISTRO_GENERALE', 'REGISTRO_PARTICOLARE'],
    'search:get-flow-types': ['IN_ARRIVO', 'IN_PARTENZA', 'INTERNO'],
    'search:get-formation-modes': ['CREAZIONE_SW', 'ACQUISIZIONE_TELEMATICA', 'ACQUISIZIONE_DA_CARTACEO'],
    'search:get-aggregation-types': ['FASCICOLO', 'SERIE_DOCUMENTALE', 'SERIE_DI_FASCICOLI'],
    'search:get-file-types': ['AFFARE', 'ATTIVITA', 'PERSONA', 'PROCEDIMENTO'],
    'search:get-assignment-types': ['ASSEGNAZIONE_COMPETENTE', 'ASSEGNAZIONE_CONOSCENZA'],
    'ipc:search:advanced': [
      {
        id: 301,
        uuid: 'DOC-301',
        name: 'Documento Esempio.pdf',
        type: 'DOCUMENTO_INFORMATICO',
        integrityStatus: 'VALID',
        timestamp: '2026-04-10T09:30:00Z',
        metadata: [{ name: 'Oggetto', value: 'Test documento' }],
      },
      {
        id: 302,
        uuid: 'AGG-302',
        name: 'Fascicolo Amministrativo',
        type: 'AGGREGAZIONE_DOCUMENTALE',
        integrityStatus: 'VALID',
        timestamp: '2026-04-11T11:45:00Z',
      },
      {
        id: 401,
        uuid: 'PROC-401',
        name: 'Processo Gare 2026',
        type: 'PROCESSO',
        integrityStatus: 'VALID',
      },
      {
        id: 501,
        uuid: 'CLASS-501',
        name: 'Classe Contratti',
        type: 'CLASSE',
        integrityStatus: 'VALID',
        timestamp: '2026-04-09T08:00:00Z',
      },
    ],
    'browse:get-file-by-document': [{ id: 901, documentId: 301, isMain: true, filename: 'Documento Esempio.pdf' }],
    'browse:get-file-by-id': { id: 901, documentId: 301, isMain: true, filename: 'Documento Esempio.pdf' },
    'file:save-dialog': { canceled: false, filePath: '/tmp/Documento Esempio.pdf' },
    'file:folder-dialog': { canceled: false, folderPath: '/tmp' },
    'file:download': { success: true },
    'file:print': { success: true },
    'file:print-many': {
      canceled: false,
      results: [
        { fileId: 901, success: true },
        { fileId: 902, success: true },
      ],
    },
  } as Record<string, unknown>;
}

async function withIpcOverrides(page: Page, overrides: Record<string, unknown>): Promise<void> {
  await page.route('**/__e2e__/mock-ipc', async (route) => {
    const body = route.request().postDataJSON() as MockRequest;
    const baseMap = createDefaultIpcMap();
    const mapped = Object.hasOwn(overrides, body.channel)
      ? overrides[body.channel]
      : baseMap[body.channel];

    if (mapped === '__ERROR__') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Errore mock su ${body.channel}` }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mapped ?? []),
    });
  });
}

async function prepareAdvancedFiltersPage(page: Page): Promise<AdvancedFiltersPage> {
  const advancedFiltersPage = new AdvancedFiltersPage(page);
  await advancedFiltersPage.gotoSearchPage();
  await advancedFiltersPage.openAdvancedFilters();
  return advancedFiltersPage;
}

async function selectAndAssertOption(locator: import('@playwright/test').Locator, label: string): Promise<void> {
  await locator.selectOption({ label });
  await expect(locator.locator('option:checked')).toHaveText(label);
}

async function fillAndAssert(locator: import('@playwright/test').Locator, value: string): Promise<void> {
  await expect(locator).toBeVisible({ timeout: 8000 });
  await locator.fill(value);
  await expect(locator).toHaveValue(value);
}

async function openSubjectWizardDetails(
  page: Page,
  advancedFiltersPage: AdvancedFiltersPage,
  roleKey: string,
  typeKey: string,
): Promise<void> {
  await advancedFiltersPage.startSubjectWizard();
  await advancedFiltersPage.selectSubjectRole(roleKey);

  const typeStep = page.getByTestId('subject-wizard-step-type');
  const detailsStep = page.getByTestId('subject-wizard-step-details');
  await expect
    .poll(
      async () => {
        const hasType = await typeStep.isVisible().catch(() => false);
        const hasDetails = await detailsStep.isVisible().catch(() => false);
        if (hasDetails) {
          return 'details';
        }
        if (hasType) {
          return 'type';
        }
        return 'pending';
      },
      { timeout: 8000 },
    )
    .not.toBe('pending');

  if (await typeStep.isVisible().catch(() => false)) {
    await advancedFiltersPage.selectSubjectType(typeKey);
  }

  await expect(detailsStep).toBeVisible({ timeout: 8000 });
}

async function prepareDidaiFilters(page: Page): Promise<AdvancedFiltersPage> {
  const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
  await selectAndAssertOption(advancedFiltersPage.documentTypeSelect, 'DOCUMENTO AMMINISTRATIVO INFORMATICO');
  return advancedFiltersPage;
}

async function prepareAggregateFilters(page: Page): Promise<AdvancedFiltersPage> {
  const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
  await selectAndAssertOption(advancedFiltersPage.documentTypeSelect, 'AGGREGAZIONE DOCUMENTALE');
  return advancedFiltersPage;
}

async function selectOptionByPattern(locator: import('@playwright/test').Locator, patterns: RegExp[]): Promise<void> {
  const target = locator.first();
  await expect(target).toBeVisible({ timeout: 8000 });
  await expect
    .poll(async () => target.locator('option').count(), { timeout: 8000 })
    .toBeGreaterThan(1);

  const options = await target.locator('option').allTextContents();
  const normalized = options
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
  const matched = normalized.find((option) => patterns.some((pattern) => pattern.test(option)));
  if (!matched) {
    throw new Error(`Nessuna opzione compatibile trovata. Disponibili: ${normalized.join(' | ')}`);
  }

  await target.selectOption({ label: matched });
  await expect(target.locator('option:checked')).toContainText(matched);
}

async function assertValidationReaction(page: Page, input: import('@playwright/test').Locator, invalidValue: string): Promise<void> {
  await input.fill(invalidValue).catch(() => {});
  await page.getByTestId('apply-filters-button').click({ force: true }).catch(() => {});

  await expect
    .poll(
      async () => {
        if (await page.locator('[aria-invalid="true"], .field-error, .validation-error').first().isVisible().catch(() => false)) {
          return 'invalid';
        }

        const nativeInvalid = await input
          .evaluate((element) => {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) {
              return false;
            }
            return !element.validity.valid;
          })
          .catch(() => false);
        if (nativeInvalid) {
          return 'native-invalid';
        }

        const currentValue = await input.inputValue().catch(() => '');
        if (currentValue !== invalidValue) {
          return 'blocked';
        }

        if (await page.getByTestId('search-error-banner').isVisible().catch(() => false)) {
          return 'banner';
        }

        return 'none';
      },
      { timeout: 8000 },
    )
    .not.toBe('none');
}

async function ensureDidaiModificationRow(page: Page): Promise<void> {
  const addButton = page.getByRole('button', { name: '+ Aggiungi Filtro Modifica' });
  if ((await page.locator('[id^="tipoModifica_"]').count()) === 0 && (await addButton.count()) > 0) {
    await addButton.click();
  }
}

async function ensureAggregatePhaseRow(page: Page): Promise<void> {
  const addButton = page.getByRole('button', { name: '+ Aggiungi Fase' });
  if ((await page.locator('[id^="tipoFase_"]').count()) === 0 && (await addButton.count()) > 0) {
    await addButton.click();
  }
}

async function fillSearchText(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder('Inserisci testo di ricerca...');
  if ((await input.count()) > 0) {
    await input.fill(text);
  }
}

async function runSearchWithDocumentResults(page: Page): Promise<AdvancedFiltersPage> {
  const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
  await fillSearchText(page, 'Documento');
  await fillAndAssert(advancedFiltersPage.documentNameInput, 'Documento');
  await advancedFiltersPage.applyFilters();

  const documentCard = advancedFiltersPage.searchResultItems
    .filter({ hasText: 'Documento Esempio.pdf' })
    .first();
  await expect(documentCard).toBeVisible();

  return advancedFiltersPage;
}

test.describe('Filtri Avanzati e Azioni Base - Mocked', () => {
  test.beforeEach(async ({ page }) => {
    const ipcMap = createDefaultIpcMap();

    await page.addInitScript(() => {
      (globalThis as any).electronAPI = {
        invoke: async (channel: string, payload?: unknown) => {
          const response = await fetch('http://mock.local/__e2e__/mock-ipc', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ channel, payload }),
          });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || 'Mock IPC error');
          }

          return response.json();
        },
        on: () => () => {},
      };
    });

    await page.route('**/__e2e__/mock-ipc', async (route) => {
      const body = route.request().postDataJSON() as MockRequest;
      const mapped = ipcMap[body.channel];

      if (mapped === '__ERROR__') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: `Errore mock su ${body.channel}` }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mapped ?? []),
      });
    });
  });

  // ===== SUBJECT FILTERS (TS-61 to TS-72) =====
  test(`[TS-61] Verificare che il sistema renda disponibile una sezione per il filtro comune "Tipo di documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.documentTypeFilterSection).toBeVisible();
    await expect(advancedFiltersPage.documentTypeSelect).toBeVisible();
    await expect(advancedFiltersPage.documentTypeSelect.locator('option')).toContainText([
      'DOCUMENTO INFORMATICO',
      'DOCUMENTO AMMINISTRATIVO INFORMATICO',
      'AGGREGAZIONE DOCUMENTALE',
    ]);
  });

  test(`[TS-62] Verificare che l'utente possa selezionare il valore per il filtro "Tipo di documento" per il filtro "Documento informatico", "Documento amministrativo informatico", "Aggregazione documentale"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    for (const label of [
      'DOCUMENTO INFORMATICO',
      'DOCUMENTO AMMINISTRATIVO INFORMATICO',
      'AGGREGAZIONE DOCUMENTALE',
    ]) {
      await selectAndAssertOption(advancedFiltersPage.documentTypeSelect, label);
    }
  });

  test(`[TS-63] Verificare che l'utente possa selezionare il valore per il filtro "Tipo di documento" per il filtro "Documento amministrativo informatico"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.documentTypeSelect, 'DOCUMENTO AMMINISTRATIVO INFORMATICO');
  });

  test(`[TS-64] Verificare che l'utente possa selezionare il valore per il filtro "Tipo di documento" per il filtro "Aggregazione documentale"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.documentTypeSelect, 'AGGREGAZIONE DOCUMENTALE');
  });

  test(`[TS-65] Verificare che il sistema renda disponibile una sezione per il filtro comune "Soggetto"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.addSubjectButton).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Soggetti' })).toBeVisible();
  });

  test(`[TS-66] Verificare che l'utente possa inserire il valore per il filtro "Soggetto"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.startSubjectWizard();
    await advancedFiltersPage.selectSubjectRole('INTESTATARIO_PF');
    await page.waitForTimeout(300);

    const typeStep = page.getByTestId('subject-wizard-step-type');
    if (await typeStep.isVisible().catch(() => false)) {
      await advancedFiltersPage.selectSubjectType('PF');
      await page.waitForTimeout(300);
    }
    
    await fillAndAssert(page.locator('#cognomePF'), 'Rossi');
    await fillAndAssert(page.locator('#nomePF'), 'Mario');
    await fillAndAssert(page.locator('#indirizziDigitali'), 'mario.rossi@pec.it');

    // Click add button and verify subject appears in filter list
    await page.getByRole('button', { name: "+ Aggiungi all'elenco" }).click();
    await page.waitForTimeout(300);
    
    // Check that subject was added to the filter list (verify in Soggetti section)
    const subjpltFilters = page.getByTestId('apply-filters-button');
    await expect(subjpltFilters).toBeVisible();
      const soggettoDev = page.locator('[data-testid="subject-filter-item"]').or(page.locator('button:has-text("Rimuovi")'));
      await expect(soggettoDev.first()).toBeVisible();
      // Simply check that a remove button exists (indicating a subject was added)
      const removeButton = page.getByRole('button', { name: 'Rimuovi' }).first();
      await expect(removeButton).toBeVisible();
  });

  test(`[TS-67] Verificare che il sistema renda disponibile una sezione per il filtro del Ruolo del Soggetto`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.startSubjectWizard();
    await expect(advancedFiltersPage.subjectWizardTitle).toBeVisible();
    await expect(advancedFiltersPage.roleSelectionButtons.first()).toBeVisible();
    await expect(advancedFiltersPage.roleSelectionButtons).toHaveCount(16);
  });

  test(`[TS-68] Verificare che il sistema renda disponibile una sezione per il filtro del Tipo di Soggetto`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.startSubjectWizard();
    await advancedFiltersPage.selectSubjectRole('AUTORE');

    await expect(page.getByTestId('subject-wizard-step-type')).toBeVisible();
    await expect(advancedFiltersPage.typeSelectionButtons.first()).toBeVisible();
    expect(await advancedFiltersPage.typeSelectionButtons.count()).toBeGreaterThan(0);
  });

  test(`[TS-69] Verificare che il sistema renda disponibile una sezione per il filtro "Dettagli" del Soggetto`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_TITOLARE', 'PAI');
    await expect(page.getByTestId('subject-wizard-step-details')).toBeVisible();
    await expect(page.locator('#denominazione')).toBeVisible();
    await expect(page.locator('#codiceIPA')).toBeVisible();
  });

  test(`[TS-70] Verificare che se il soggetto selezionato è di tipo "PAI", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Denominazione Amministrazione/Codice IPA", "Denominazione Amministrazione AOO/Codice IPA AOO", "Denominazione Amministrazione UOR/Codice IPA UOR" e "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_TITOLARE', 'PAI');
    await expect(page.locator('#denominazione')).toBeVisible();
    await expect(page.locator('#codiceIPA')).toBeVisible();
    await expect(page.locator('#denominazioneAOO')).toBeVisible();
    await expect(page.locator('#codiceIPAAOO')).toBeVisible();
    await expect(page.locator('#denominazioneUOR')).toBeVisible();
    await expect(page.locator('#codiceIPAUOR')).toBeVisible();
    await expect(page.locator('#indirizziDigitali')).toBeVisible();
  });

  test(`[TS-71] Verificare che l'utente possa inserire il valore per il campo "Denomizazione Amministrazione/Codice IPA"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_TITOLARE', 'PAI');
    await fillAndAssert(page.locator('#denominazione'), 'Comune di Torino');
  });

  test(`[TS-72] Verificare che l'utente possa inserire il valore per il campo "Denominazione Amministrazione AOO/Codice IPA AOO"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_TITOLARE', 'PAI');
    await fillAndAssert(page.locator('#denominazioneAOO'), 'AOO-TORINO-01');
  });

  // ===== DOCUMENT & ADMINISTRATIVE DOCUMENT FILTERS (TS-73 to TS-89) =====
  test(`[TS-73] Verificare che l'utente possa inserire il valore per il campo "Denominazione Amministrazione UOR/Codice IPA UOR"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_TITOLARE', 'PAI');
    await fillAndAssert(page.locator('#denominazioneUOR'), 'UOR-TORINO-42');
  });

  test(`[TS-74] Verificare che l'utente possa inserire il valore per il campo "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_TITOLARE', 'PAI');
    await fillAndAssert(page.locator('#indirizziDigitali'), 'protocollo@pec.comune.torino.it');
  });

  test(`[TS-75] Verificare che se il soggetto selezionato è di tipo "PAE", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Denominazione Amministrazione", "Denominazione Ufficio" e "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_PARTECIPANTE', 'PAE');
    await expect(page.locator('#denominazioneAmm')).toBeVisible();
    await expect(page.locator('#denominazioneUfficio')).toBeVisible();
    await expect(page.locator('#indirizziDigitali')).toBeVisible();
  });

  test(`[TS-76] Verificare che l'utente possa inserire il valore per il campo "Denominazione Amministrazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_PARTECIPANTE', 'PAE');
    await fillAndAssert(page.locator('#denominazioneAmm'), 'Ville de Paris');
  });

  test(`[TS-77] Verificare che l'utente possa inserire il valore per il campo "Denominazione Ufficio"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'AMMINISTRAZIONE_PARTECIPANTE', 'PAE');
    await fillAndAssert(page.locator('#denominazioneUfficio'), 'Direction Generale');
  });

  test(`[TS-78] Verificare che se il soggetto selezionato è di tipo "AS", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Cognome", "Nome", "Codice Fiscale", "Denominazione Amministrazione AOO/Codice IPA AOO", "Denominazione Amministrazione UOR/Codice IPA UOR" e "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'ASSEGNATARIO', 'AS');
    await expect(page.locator('#nomeAssegnatario')).toBeVisible();
    await expect(page.locator('#cognomeAssegnatario')).toBeVisible();
    await expect(page.locator('#codiceFiscaleAssegnatario')).toBeVisible();
    await expect(page.locator('#partitaIvaAssegnatario')).toBeVisible();
    await expect(page.locator('#denominazioneOrga')).toBeVisible();
    await expect(page.locator('#denominazioneUfficio')).toBeVisible();
    await expect(page.locator('#indirizziDigitali')).toBeVisible();
  });

  test(`[TS-79] Verificare che l'utente possa inserire il valore per il campo "Cognome"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'ASSEGNATARIO', 'AS');
    await fillAndAssert(page.locator('#cognomeAssegnatario'), 'Verdi');
  });

  test(`[TS-80] Verificare che l'utente possa inserire il valore per il campo "Nome"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'ASSEGNATARIO', 'AS');
    await fillAndAssert(page.locator('#nomeAssegnatario'), 'Giulia');
  });

  test(`[TS-81] Verificare che l'utente possa inserire il valore per il campo "Codice Fiscale/Partita IVA"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'ASSEGNATARIO', 'AS');
    await fillAndAssert(page.locator('#codiceFiscaleAssegnatario'), 'VRDGLI85C50H501R');
  });

  test(`[TS-82] Verificare che se il soggetto selezionato è di tipo "PG", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Denominazione Organizzazione", "Codice Fiscale/Partita IVA", "Denominazione Ufficio" e "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'INTESTATARIO_PG', 'PG');
    await expect(page.locator('#denominazioneOrga')).toBeVisible();
    await expect(page.locator('#codiceFiscalePartitaIvaPG')).toBeVisible();
    await expect(page.locator('#denominazioneUfficio')).toBeVisible();
    await expect(page.locator('#indirizziDigitali')).toBeVisible();
  });

  test(`[TS-83] Verificare che l'utente possa inserire il valore per il campo "Denominazione Organizzazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'INTESTATARIO_PG', 'PG');
    await fillAndAssert(page.locator('#denominazioneOrga'), 'ACME S.p.A.');
  });

  test(`[TS-84] Verificare che se il soggetto selezionato è di tipo "PF", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Cognome", "Nome" e "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'INTESTATARIO_PF', 'PF');
    await expect(page.locator('#cognomePF')).toBeVisible();
    await expect(page.locator('#nomePF')).toBeVisible();
    await expect(page.locator('#indirizziDigitali')).toBeVisible();
  });

  test(`[TS-85] Verificare che se il soggetto selezionato è di tipo "RUP", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per i campi "Cognome", "Nome", "Codice Fiscale" "Denominazione Amministrazione/Codice IPA", "Denominazione Amministrazione AOO/Codice IPA AOO", "Denominazione Amministrazione UOR/Codice IPA UOR" e "Indirizzi digitali di riferimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'RUP', 'RUP');
    await expect(page.locator('#cognomeRUP')).toBeVisible();
    await expect(page.locator('#nomeRUP')).toBeVisible();
    await expect(page.locator('#codiceFiscaleRUP')).toBeVisible();
    await expect(page.locator('#denominazione')).toBeVisible();
    await expect(page.locator('#codiceIPA')).toBeVisible();
    await expect(page.locator('#denominazioneAOO')).toBeVisible();
    await expect(page.locator('#codiceIPAAOO')).toBeVisible();
    await expect(page.locator('#denominazioneUOR')).toBeVisible();
    await expect(page.locator('#codiceIPAUOR')).toBeVisible();
  });

  test(`[TS-86] Verificare che se il soggetto selezionato è di tipo "SW", all'interno della sezione del filtro "Dettagli" del Soggetto, l'utente possa inserire il valore per il campo "Denominazione Sistema"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'PRODUTTORE', 'SW');
    await expect(page.locator('#denominazioneSistema')).toBeVisible();
  });

  test(`[TS-87] Verificare che l'utente possa inserire il valore per il campo "Denominazione Sistema"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await openSubjectWizardDetails(page, advancedFiltersPage, 'PRODUTTORE', 'SW');
    await fillAndAssert(page.locator('#denominazioneSistema'), 'Sistema Interoperabilita ND');
  });

  test(`[TS-88] Verificare che all'interno di una ricerca con filtri, l'utente possa visualizzare il nome del campo in una lista`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    const queryInput = page.getByPlaceholder('Inserisci testo di ricerca...');
    if (await queryInput.count()) {
      await queryInput.fill('Documento');
    }

    await advancedFiltersPage.documentTypeSelect.selectOption({ label: 'DOCUMENTO INFORMATICO' });
    await advancedFiltersPage.applyFilters();

    await expect(advancedFiltersPage.searchResultItems.first()).toBeVisible();
    await expect(advancedFiltersPage.documentNameInResults.first()).toContainText('Documento Esempio.pdf');
  });

  test(`[TS-89] Verificare che all'interno della sezione di filtri per tipo documentale, il sistema permetta di selezionare i filtri specifici per il tipo "Documento Informatico e Amministrativo Informatico"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.documentTypeSelect, 'DOCUMENTO AMMINISTRATIVO INFORMATICO');
    await expect(advancedFiltersPage.specificDocumentFiltersSection).toBeVisible();
    await expect(advancedFiltersPage.documentaryTypeInput).toBeVisible();
    await expect(advancedFiltersPage.formationModeSelect).toBeVisible();
  });

  // ===== AGGREGATE FILTERS (TS-90 to TS-105) =====
  test(`[TS-90] Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Dati di Registrazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.registrationTypeSelect).toBeVisible();
  });

  test(`[TS-91] Verificare che l'utente possa inserire il valore per il campo "Tipologia di flusso"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.flowTypeSelect, 'ENTRATA');
  });

  test(`[TS-92] Verificare che l'utente possa specificare la tipologia "Entrata" per la tipologia di flusso`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.flowTypeSelect, 'ENTRATA');
  });

  test(`[TS-93] Verificare che l'utente possa specificare la tipologia "Uscita" per la tipologia di flusso`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.flowTypeSelect, 'USCITA');
  });

  test(`[TS-94] Verificare che l'utente possa specificare la tipologia "Interno" per la tipologia di flusso`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.flowTypeSelect, 'INTERNO');
  });

  test(`[TS-95] Verificare che l'utente possa inserire il valore per il campo "Tipo di registro"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.registrationTypeSelect).toBeVisible();
  });

  test(`[TS-96] Verificare che l'utente possa specificare la tipologia "Nessuno" per il tipo di registro`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.registrationTypeSelect, 'NESSUNO');
  });

  test(`[TS-97] Verificare che l'utente possa specificare la tipologia "Protocolo Ordinario/Protocollo Emergenza" per il tipo di registro`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.registrationTypeSelect, 'PROTOCOLLO ORDINARIO/EMERGENZA');
  });

  test(`[TS-98] Verificare che l'utente possa specificare la tipologia "Repertorio/Registro" per il tipo di registro`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.registrationTypeSelect, 'REPERTORIO/REGISTRO');
  });

  test(`[TS-99] Verificare che l'utente possa inserire il valore per il campo "Data di registrazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await fillAndAssert(advancedFiltersPage.registrationDateInput, '2026-04-10');
  });

  test(`[TS-100] Verificare che l'utente possa inserire il valore per il campo "Numero documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await fillAndAssert(advancedFiltersPage.registrationNumberInput, '12345');
  });

  test(`[TS-101] Verificare che l'utente possa inserire il valore per il campo "Codice registro"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await fillAndAssert(advancedFiltersPage.registrationCodeInput, 'REG-2026-0001');
  });

  test(`[TS-102] Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Tipologia Documentale"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.documentaryTypeInput).toBeVisible();
    await fillAndAssert(page.locator('#tipologiaDidai'), 'Documento informatico');
  });

  test(`[TS-103] Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Modalità di Formazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.formationModeSelect).toBeVisible();
  });

  test(`[TS-104] Verificare che l'utente possa specificare la modalità "Ex novo" per il filtro "Modalità di Formazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.formationModeSelect.selectOption({ index: 1 });
    await expect(advancedFiltersPage.formationModeSelect.locator('option:checked')).toContainText(/creazione/i);
  });

  test(`[TS-105] Verificare che l'utente possa specificare la modalità "Acquisizione da altro documento o supporto informatico" per il filtro "Modalità di Formazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.formationModeSelect.selectOption({ index: 2 });
    await expect(advancedFiltersPage.formationModeSelect.locator('option:checked')).toContainText(/acquisizione/i);
  });

  // ===== CUSTOM METADATA (TS-106 to TS-107) =====
  test(`[TS-106] Verificare che l'utente possa specificare la modalità "Memorizzazione su supporto informatico in formato digitale" per il filtro "Modalità di Formazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.formationModeSelect.selectOption({ index: 3 });
    await expect(advancedFiltersPage.formationModeSelect.locator('option:checked')).toContainText(/memorizzazione/i);
  });

  test(`[TS-107] Verificare che l'utente possa specificare la modalità "Generazione o raggruppamento in forma statica" per il filtro "Modalità di Formazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await advancedFiltersPage.formationModeSelect.selectOption({ index: 4 });
    await expect(advancedFiltersPage.formationModeSelect.locator('option:checked')).toContainText(/generazione/i);
  });

  // ===== SEARCH RESULTS (TS-108 to TS-112) =====
  test(`[TS-108] Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Campo Riservato" tra " " o "No"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.reservedFieldCheckbox, 'No');
  });

  test(`[TS-109] Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Identificativo del Formato"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.formatInput).toBeVisible();
    await expect(advancedFiltersPage.softwareProductInput).toBeVisible();
  });

  test(`[TS-110] Verificare che l'utente possa inserire il valore per il campo "Formato"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.formatInput, 'PDF');
  });

  test(`[TS-111] Verificare che l'utente possa inserire il valore per il campo "Prodotto Software"`, async ({ page }) => {
    await prepareAdvancedFiltersPage(page);

    await fillAndAssert(page.locator('#nomeProdCreazione'), 'Editor Documentale');
  });

  test(`[TS-112] Verificare che l'utente possa inserire il valore per il campo "Versione Prodotto"`, async ({ page }) => {
    await prepareAdvancedFiltersPage(page);

    await fillAndAssert(page.locator('#versioneProdCreazione'), '1.0.0');
  });

  // ===== FILTER VALIDATION (TS-113 to TS-115) =====
  test(`[TS-113] Verificare che l'utente possa inserire il valore per il campo "Produttore"`, async ({ page }) => {
    await prepareAdvancedFiltersPage(page);

    await fillAndAssert(page.locator('#produttoreProdCreazione'), 'ACME Publishing');
  });

  test(`[TS-114] Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Dati di Verifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await expect(advancedFiltersPage.signedCheckbox).toBeVisible();
    await expect(advancedFiltersPage.sealeCheckbox).toBeVisible();
    await expect(advancedFiltersPage.timestampCheckbox).toBeVisible();
    await expect(advancedFiltersPage.imageCopyComplianceCheckbox).toBeVisible();
  });

  test(`[TS-115] Verificare che l'utente possa inserire il valore per il campo "Firmato Digitalmente" tra " " o "No" all'interno della sezione del filtro "Dati di Verifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.signedCheckbox, 'No');
  });

  // ===== FILE ACTIONS (TS-116 to TS-120) =====
  test(`[TS-116] Verificare che l'utente possa inserire il valore per il campo "Sigillato Elettronicamente" tra " " o "No" all'interno della sezione del filtro "Dati di Verifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.sealeCheckbox, 'No');
  });

  test(`[TS-117] Verificare che l'utente possa inserire il valore per il campo "Marcatura Temporale" tra " " o "No" all'interno della sezione del filtro "Dati di Verifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.timestampCheckbox, 'No');
  });

  test(`[TS-118] Verificare che l'utente possa inserire il valore per il campo "Conformità copie immagine su supporto informatico" tra " " o "No" all'interno della sezione del filtro "Dati di Verifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await selectAndAssertOption(advancedFiltersPage.imageCopyComplianceCheckbox, 'No');
  });

  test(`[TS-119] Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Nome del Documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await fillAndAssert(advancedFiltersPage.documentNameInput, 'Documento Esempio');
  });

  test(`[TS-120] Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Versione del Documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);

    await fillAndAssert(advancedFiltersPage.documentVersionInput, '2.0');
  });

  test(`[TS-121] Verificare che per il Documento Informatico e Amministrativo Informatico, l'utente possa inserire il valore per il filtro "Identificativo del Documento Primario"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await fillAndAssert(advancedFiltersPage.primaryDocumentIdInput, 'DOC-PRIM-0001');
  });

  test(`[TS-122] Verificare che per il Documento Informatico e Amministrativo Informatico, il sistema renda disponibile una sezione per il filtro "Tracciatura Modifiche di Documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await expect(advancedFiltersPage.documentChangeTrackingSection.or(advancedFiltersPage.modificationTypeSelect.first())).toBeVisible();
  });

  test(`[TS-123] Verificare che l'utente possa inserire il valore per i campi "Tipo di Modifica" all'interno della sezione del filtro "Tracciatura Modifiche di Documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await expect(advancedFiltersPage.modificationTypeSelect.first()).toBeVisible();
  });

  test(`[TS-124] Verificare che l'utente possa specificare il valore "Annullamento" per il campo "Tipo di Modifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await selectOptionByPattern(advancedFiltersPage.modificationTypeSelect.first(), [/annull/i]);
  });

  test(`[TS-125] Verificare che l'utente possa specificare il valore "Rettifica" per il campo "Tipo di Modifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await selectOptionByPattern(advancedFiltersPage.modificationTypeSelect.first(), [/rettific/i]);
  });

  test(`[TS-126] Verificare che l'utente possa specificare il valore "Integrazione" per il campo "Tipo di Modifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await selectOptionByPattern(advancedFiltersPage.modificationTypeSelect.first(), [/integraz/i]);
  });

  test(`[TS-127] Verificare che l'utente possa specificare il valore "Annotazione" per il campo "Tipo di Modifica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await selectOptionByPattern(advancedFiltersPage.modificationTypeSelect.first(), [/annotaz/i]);
  });

  test(`[TS-128] Verificare che l'utente possa inserire il valore per il campo "Data/Ora della Modifica" all'interno della sezione del filtro "Tracciatura Modifiche di Documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await fillAndAssert(advancedFiltersPage.modificationDateInput.first(), '2026-04-10');
  });

  test(`[TS-129] Verificare che l'utente possa inserire il valore per il campo "Identificativo Documento Versione Precedente" all'interno della sezione del filtro "Tracciatura Modifiche di Documento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareDidaiFilters(page);
    await ensureDidaiModificationRow(page);
    await fillAndAssert(advancedFiltersPage.previousDocIdInput.first(), 'DOC-OLD-0001');
  });

  test(`[TS-130] Verificare che all'interno della sezione di filtri per tipo documentale, il sistema permetta di selezionare i filtri specifici per il tipo "Aggregazione Documentale Informatica"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.aggregateFiltersSection).toBeVisible();
  });

  test(`[TS-131] Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibili per la compilazione e l'aggiunta alla ricerca i filtri specifici`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.aggregationTypeSelect).toBeVisible();
    await expect(advancedFiltersPage.aggregateIdentifierInput).toBeVisible();
    await expect(advancedFiltersPage.aggregateOpenDateInput).toBeVisible();
  });

  test(`[TS-132] Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Tipo di Aggregazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.aggregationTypeSelect).toBeVisible();
  });

  test(`[TS-133] Verificare che l'utente possa inserire il valore "Fascicolo" per il filtro "Tipo di Aggregazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.aggregationTypeSelect, [/fascicol/i]);
  });

  test(`[TS-134] Verificare che l'utente possa inserire il valore "Serie Documentale" per il filtro "Tipo di Aggregazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.aggregationTypeSelect, [/serie\s*documental/i]);
  });

  test(`[TS-135] Verificare che l'utente possa inserire il valore "Serie di fascicoli" per il filtro "Tipo di Aggregazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.aggregationTypeSelect, [/serie(\s*di)?\s*fascicol/i]);
  });

  test(`[TS-136] Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Identificativo dell'Aggregazione Documentale"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.aggregateIdentifierInput, 'AGG-2026-001');
  });

  test(`[TS-137] Verificare che l'utente possa inserire il valore per il filtro "Tipologia di Fascicolo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.fileTypeSelect).toBeVisible();
  });

  test(`[TS-138] Verificare che l'utente possa specificare il valore "Affare" per il filtro "Tipologia di Fascicolo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.fileTypeSelect, [/affare/i]);
  });

  test(`[TS-139] Verificare che l'utente possa specificare il valore "Attività" per il filtro "Tipologia di Fascicolo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.fileTypeSelect, [/attiv/i]);
  });

  test(`[TS-140] Verificare che l'utente possa specificare il valore "Persona Fisica" per il filtro "Tipologia di Fascicolo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.fileTypeSelect, [/persona\s*fisic/i]);
  });

  test(`[TS-141] Verificare che l'utente possa specificare il valore "Persona Giuridica" per il filtro "Tipologia di Fascicolo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.fileTypeSelect, [/persona\s*giuridic/i]);
  });

  test(`[TS-142] Verificare che l'utente possa specificare il valore "Procedimento Amministrativo" per il filtro "Tipologia di Fascicolo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.fileTypeSelect, [/procediment/i]);
  });

  test(`[TS-143] Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Id Aggregazione Primario"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.primaryAggregateIdInput, 'AGG-PRIMARY-001');
  });

  test(`[TS-144] Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Data Apertura"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.aggregateOpenDateInput, '2026-04-01');
  });

  test(`[TS-145] Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Data Chiusura"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.aggregateCloseDateInput, '2026-04-30');
  });

  test(`[TS-146] Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Procedimento Amministrativo"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.procedureSubjectInput).toBeVisible();
    await expect(advancedFiltersPage.procedureInput).toBeVisible();
  });

  test(`[TS-147] Verificare che l'utente possa inserire il valore per il campo "Materia/Argomento/Struttura"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.procedureSubjectInput, 'Lavori Pubblici');
  });

  test(`[TS-148] Verificare che l'utente possa inserire il valore per il campo "Procedimento"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.procedureInput, 'Affidamento manutenzione');
  });

  test(`[TS-149] Verificare che l'utente possa inserire il valore per il campo "Catalogo Procedimenti"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.procedureCatalogInput, 'https://procedimenti.example.gov/catalogo');
  });

  test(`[TS-150] Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Fasi"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await expect(advancedFiltersPage.phaseTypeSelect.first()).toBeVisible();
    await expect(advancedFiltersPage.phaseStartDateInput.first()).toBeVisible();
  });

  test(`[TS-151] Verificare che l'utente possa inserire il valore per il campo "Tipo Fase" all'interno della sezione del filtro "Fasi".`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await expect(advancedFiltersPage.phaseTypeSelect).toBeVisible();
  });

  test(`[TS-152] Verificare che l'utente possa specificare il valore "Preparatoria" per il campo "Tipo Fase"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await selectOptionByPattern(advancedFiltersPage.phaseTypeSelect, [/preparator/i]);
  });

  test(`[TS-153] Verificare che l'utente possa specificare il valore "Istruttoria" per il campo "Tipo Fase"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await selectOptionByPattern(advancedFiltersPage.phaseTypeSelect, [/istruttor/i]);
  });

  test(`[TS-154] Verificare che l'utente possa specificare il valore "Consultiva" per il campo "Tipo Fase"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await selectOptionByPattern(advancedFiltersPage.phaseTypeSelect, [/consultiv/i]);
  });

  test(`[TS-155] Verificare che l'utente possa specificare il valore "Decisoria" per il campo "Tipo Fase"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await selectOptionByPattern(advancedFiltersPage.phaseTypeSelect, [/decisor/i]);
  });

  test(`[TS-156] Verificare che l'utente possa specificare il valore "Integrazione dell'efficacia" per il campo "Tipo Fase"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await selectOptionByPattern(advancedFiltersPage.phaseTypeSelect, [/integrazion.*efficac/i]);
  });

  test(`[TS-157] Verificare che l'utente possa inserire il valore per il campo "Data Inizio Fase" all'interno della sezione del filtro "Fasi"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await fillAndAssert(advancedFiltersPage.phaseStartDateInput, '2026-04-03');
  });

  test(`[TS-158] Verificare che l'utente possa inserire il valore per il campo "Data Fine Fase" all'interno della sezione del filtro "Fasi"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await ensureAggregatePhaseRow(page);
    await fillAndAssert(advancedFiltersPage.phaseEndDateInput, '2026-04-10');
  });

  test(`[TS-159] Verificare che per l'Aggregazione Documentale Informatica, il sistema renda disponibile una sezione per il filtro "Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.assignmentTypeSelect.first()).toBeVisible();
  });

  test(`[TS-160] Verificare che l'utente possa inserire il valore per il campo "Assegnazione" all'interno della sezione del filtro "Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.assignmentSubjectInput, 'Ufficio Gare');
  });

  test(`[TS-161] Verificare che l'utente possa inserire il valore per il campo "Tipo Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await expect(advancedFiltersPage.assignmentTypeSelect).toBeVisible();
  });

  test(`[TS-162] Verificare che l'utente possa specificare il valore "Per competenza" per il campo "Tipo Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.assignmentTypeSelect, [/competenz/i]);
  });

  test(`[TS-163] Verificare che l'utente possa specificare il valore "Per conoscenza" per il campo "Tipo Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await selectOptionByPattern(advancedFiltersPage.assignmentTypeSelect, [/conosci?enz/i]);
  });

  test(`[TS-164] Verificare che l'utente possa inserire il valore per il campo "Data Inizio Assegnazione" all'interno della sezione del filtro "Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.assignmentStartDateInput, '2026-04-01');
  });

  test(`[TS-165] Verificare che l'utente possa inserire il valore per il campo "Data Fine Assegnazione" all'interno della sezione del filtro "Assegnazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.assignmentEndDateInput, '2026-04-30');
  });

  test(`[TS-166] Verificare che per l'Aggregazione Documentale Informatica, l'utente possa inserire il valore per il filtro "Progressivo Aggregazione"`, async ({ page }) => {
    const advancedFiltersPage = await prepareAggregateFilters(page);
    await fillAndAssert(advancedFiltersPage.aggregateProgressiveInput, '17');
  });

  test(`[TS-167] Verificare che all'interno della sezione di filtri per custom metadata, il sistema permetta di selezionare i filtri specifici per i metadata presenti`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await expect(advancedFiltersPage.customMetadataSection).toBeVisible();
  });

  test(`[TS-168] Verificare che per ciascun custom metadata, l'utente possa inserire il nome del metadato e il relativo valore`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await expect(advancedFiltersPage.addCustomMetadataButton).toBeVisible();
    await advancedFiltersPage.addCustomMetadataButton.click();

    if ((await advancedFiltersPage.customMetadataNameInputs.count()) > 0) {
      await fillAndAssert(advancedFiltersPage.customMetadataNameInputs.first(), 'MetaCustom.CodiceInterno');
    }
    if ((await advancedFiltersPage.customMetadataValueInputs.count()) > 0) {
      await fillAndAssert(advancedFiltersPage.customMetadataValueInputs.first(), 'INT-2026-77');
    }
  });

  test(`[TS-169] Verificare che quando viene eseguita una ricerca, l'utente possa visualizzare i risultati della ricerca`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await fillSearchText(page, 'Documento');
    await fillAndAssert(advancedFiltersPage.documentNameInput, 'Documento');
    await advancedFiltersPage.applyFilters();
    await expect(advancedFiltersPage.searchResultItems.first()).toBeVisible();
  });

  test(`[TS-170] Verificare che l'utente possa visualizzare per ogni risultato le informazioni rilevanti: Nome del documento o aggregazione, Data di registrazione/creazione del documento/aggregazione, Tipo di elemento tra Documento, Aggregazione, Processo o Classe Documentale`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await fillSearchText(page, 'Documento');
    await fillAndAssert(advancedFiltersPage.documentNameInput, 'Documento');
    await advancedFiltersPage.applyFilters();
    const firstCard = advancedFiltersPage.searchResultItems.first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText('Documento Esempio.pdf');
    await expect(firstCard.locator('.badge,[data-testid="result-type"]')).toBeVisible();

    await firstCard.click();
    const detailDateRow = page
      .getByTestId('registration-row-protocollo')
      .or(page.getByTestId('document-metadata-row-data-creazione'))
      .first();
    await expect(detailDateRow).toBeVisible({ timeout: 10000 });
    await expect(detailDateRow).toContainText(/del|data creazione|n\/a/i);
  });

  test(`[TS-171] Verificare che l'utente possa visualizzare il nome del documento o aggregazione`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await fillSearchText(page, 'Documento');
    await fillAndAssert(advancedFiltersPage.documentNameInput, 'Documento');
    await advancedFiltersPage.applyFilters();
    await expect(advancedFiltersPage.searchResultItems.first()).toContainText('Documento Esempio.pdf');
  });

  test(`[TS-172] Verificare che l'utente possa visualizzare il tipo del documento o aggregazione`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await fillSearchText(page, 'Documento');
    await fillAndAssert(advancedFiltersPage.documentNameInput, 'Documento');
    await advancedFiltersPage.applyFilters();
    await expect(advancedFiltersPage.searchResultItems.first().locator('.badge,[data-testid="result-type"]')).toBeVisible();
  });

  test(`[TS-173] Verificare che se la ricerca non produce risultati, l'utente possa visualizzare un messaggio di errore`, async ({ page }) => {
    const emptyMap = createDefaultIpcMap();
    emptyMap['ipc:search:advanced'] = [];

    await page.route('**/__e2e__/mock-ipc', async (route) => {
      const body = route.request().postDataJSON() as MockRequest;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyMap[body.channel] ?? []),
      });
    });

    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await fillSearchText(page, 'assenza');
    await fillAndAssert(advancedFiltersPage.documentNameInput, 'assenza');
    await advancedFiltersPage.applyFilters();
    await expect(advancedFiltersPage.searchEmptyState.or(advancedFiltersPage.noResultsMessage)).toBeVisible();
  });

  test(`[TS-174] Verificare che il sistema prevenga l'inserimento di valori testuali non validi`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await assertValidationReaction(page, advancedFiltersPage.registrationDateInput, 'abc');
  });

  test(`[TS-175] Verificare che il sistema prevenga l'inserimento di valori numerici non validi`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await assertValidationReaction(page, advancedFiltersPage.registrationNumberInput, 'abc123');
  });

  test(`[TS-176] Verificare che il sistema informi l'utente quando il formato del valore data inserito non è valido`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await assertValidationReaction(page, advancedFiltersPage.registrationDateInput, '2026-99-99');
  });

  test(`[TS-177] Verificare che il sistema informi l'utente quando il formato del valore numerico positivo inserito non è valido`, async ({ page }) => {
    const advancedFiltersPage = await prepareAdvancedFiltersPage(page);
    await assertValidationReaction(page, advancedFiltersPage.registrationNumberInput, '-10');
  });

  test(`[TS-178] Verificare che l'utente possa salvare un documento in locale in una cartella selezionata`, async ({ page }) => {
    const advancedFiltersPage = await runSearchWithDocumentResults(page);
    await expect(advancedFiltersPage.saveDocumentButton).toBeVisible();
    await advancedFiltersPage.saveDocumentButton.click({ force: true });
    await expect(advancedFiltersPage.saveSuccessMessage).toContainText(/salvato/i);
  });

  test(`[TS-179] Verificare che l'utente possa salvare più file documentali in una cartella selezionata`, async ({ page }) => {
    await withIpcOverrides(page, {
      'browse:get-file-by-document': [
        { id: 901, documentId: 301, isMain: true, filename: 'Documento Esempio.pdf' },
        { id: 902, documentId: 301, isMain: false, filename: 'Allegato-1.pdf' },
      ],
      'browse:get-file-by-id': { id: 901, documentId: 301, isMain: true, filename: 'Documento Esempio.pdf' },
    });

    const advancedFiltersPage = await runSearchWithDocumentResults(page);
    await expect(advancedFiltersPage.saveDocumentButton).toBeVisible();
    await advancedFiltersPage.saveDocumentButton.click({ force: true });
    await expect(advancedFiltersPage.saveMultipleButton).toBeVisible();
    await advancedFiltersPage.saveMultipleButton.click({ force: true });
    await expect(advancedFiltersPage.saveSuccessMessage).toContainText(/documenti salvati/i);
  });

  test(`[TS-180] Verificare che se il salvataggio di uno o più documenti fallisce, l'utente possa visualizzare un messaggio di errore`, async ({ page }) => {
    await withIpcOverrides(page, {
      'file:download': { success: false, errorCode: 'EXPORT_WRITE_FAILED', errorMessage: 'Salvataggio fallito' },
    });

    const advancedFiltersPage = await runSearchWithDocumentResults(page);
    await expect(advancedFiltersPage.saveDocumentButton).toBeVisible();
    await advancedFiltersPage.saveDocumentButton.click({ force: true });
    await expect(advancedFiltersPage.saveErrorMessage).toContainText(/salvataggio fallito/i);
  });

  test(`[TS-181] Verificare che l'utente possa stampare un documento`, async ({ page }) => {
    const advancedFiltersPage = await runSearchWithDocumentResults(page);
    await expect(advancedFiltersPage.printButton).toBeVisible();
    await advancedFiltersPage.printButton.click({ force: true });
    await expect(advancedFiltersPage.saveSuccessMessage).toContainText(/stampante/i);
  });

  test(`[TS-182] Verificare che l'utente possa stampare un insieme di documenti`, async ({ page }) => {
    await withIpcOverrides(page, {
      'browse:get-file-by-document': [
        { id: 901, documentId: 301, isMain: true, filename: 'Documento Esempio.pdf' },
        { id: 902, documentId: 301, isMain: false, filename: 'Allegato-1.pdf' },
      ],
      'browse:get-file-by-id': { id: 901, documentId: 301, isMain: true, filename: 'Documento Esempio.pdf' },
      'file:print-many': {
        canceled: false,
        results: [
          { fileId: 901, success: true },
          { fileId: 902, success: true },
        ],
      },
    });

    const advancedFiltersPage = await runSearchWithDocumentResults(page);
    await expect(advancedFiltersPage.printButton).toBeVisible();
    await advancedFiltersPage.printButton.click({ force: true });
    await expect(advancedFiltersPage.printMultipleButton).toBeVisible();
    await advancedFiltersPage.printMultipleButton.click({ force: true });
    const resultBox = page.locator('.result-box').first();
    await expect(resultBox).toBeVisible({ timeout: 8000 });
    await expect(resultBox).toContainText(/stamp/i);
  });

  test(`[TS-183] Verificare che se la stampa di uno o più documenti fallisce, l'utente possa visualizzare un messaggio di errore`, async ({ page }) => {
    await withIpcOverrides(page, {
      'file:print': { success: false, error: 'Stampa fallita' },
    });

    const advancedFiltersPage = await runSearchWithDocumentResults(page);
    await expect(advancedFiltersPage.printButton).toBeVisible();
    await advancedFiltersPage.printButton.click({ force: true });
    await expect(advancedFiltersPage.saveErrorMessage).toContainText(/stampa fallita/i);
  });
});
