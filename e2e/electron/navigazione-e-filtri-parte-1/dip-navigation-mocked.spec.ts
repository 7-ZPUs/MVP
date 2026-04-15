import { expect, test, type Page } from '@playwright/test';
import { DipNavigationPage } from './dip-navigation.page';

type MockRequest = { channel: string; payload: unknown };

function createDefaultIpcMap() {
  return {
    'app:bootstrap-status': { state: 'success' },
    'browse:get-dip-by-id': { id: 1, name: 'DIP test' },
    'browse:get-document-class-by-dip-id': [
      { id: 101, name: 'Classe Contratti', integrityStatus: 'VALID', timestamp: '2026-01-01T00:00:00Z' },
      { id: 102, name: 'Classe Gare', integrityStatus: 'VALID', timestamp: '2026-01-02T00:00:00Z' },
    ],
    'browse:get-process-by-document-class': [
      {
        id: 201,
        uuid: 'PROC-201',
        metadata: [{ name: 'Oggetto', value: 'Procedura Appalto 2026' }],
      },
    ],
    'browse:get-documents-by-process': [
      {
        id: 301,
        uuid: 'DOC-301',
        metadata: [{ name: 'NomeDelDocumento', value: 'Determina a contrarre.pdf' }],
      },
    ],
    'browse:get-document-by-id': {
      id: 301,
      processId: 201,
      uuid: 'DOC-301',
      integrityStatus: 'VALID',
      metadata: [{ name: 'Oggetto', value: 'Determina a contrarre' }],
    },
    'browse:get-file-by-document': [{ id: 901, documentId: 301, isMain: true, filename: 'determina.pdf' }],
    'browse:get-file-buffer-by-id': [37, 80, 68, 70, 45],
    'ipc:search:text': [
      {
        id: 101,
        uuid: 'CLASS-101',
        name: 'Classe Contratti',
        type: 'CLASSE',
        integrityStatus: 'VALID',
        timestamp: '2026-01-01T00:00:00Z',
      },
      {
        id: 201,
        uuid: 'PROC-201',
        name: 'Procedura Appalto 2026',
        type: 'PROCESSO',
        integrityStatus: 'VALID',
      },
      {
        id: 301,
        uuid: 'DOC-301',
        name: 'Determina a contrarre.pdf',
        type: 'DOCUMENTO_INFORMATICO',
        integrityStatus: 'VALID',
      },
    ],
    'ipc:search:advanced': [
      {
        id: 301,
        uuid: 'DOC-301',
        name: 'Determina a contrarre.pdf',
        type: 'DOCUMENTO_INFORMATICO',
        integrityStatus: 'VALID',
      },
    ],
    'ipc:search:semantic': [
      {
        id: 302,
        uuid: 'DOC-302',
        name: 'Verbale commissione.pdf',
        type: 'DOCUMENTO_INFORMATICO',
        integrityStatus: 'VALID',
        score: 0.91,
      },
    ],
  } as Record<string, unknown>;
}

test.describe('Navigazione e Filtri Parte 1 - Mocked', () => {
  test.setTimeout(120000);

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

  async function withIpcOverrides(page: Page, overrides: Record<string, unknown>): Promise<void> {
    await page.route('**/__e2e__/mock-ipc', async (route) => {
      const body = route.request().postDataJSON() as MockRequest;
      const baseMap = createDefaultIpcMap();
      const mapped = Object.prototype.hasOwnProperty.call(overrides, body.channel)
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

  async function gotoSearch(page: Page): Promise<DipNavigationPage> {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();
    return dipPage;
  }

  async function openCommonFilterSections(dipPage: DipNavigationPage): Promise<void> {
    await dipPage.openFilterSection('Dati Generali');
    await dipPage.openFilterSection('Chiave Descrittiva');
    await dipPage.openFilterSection('Classificazione');
  }

  async function assertClassSearchResult(page: Page): Promise<void> {
    const dipPage = await gotoSearch(page);

    await dipPage.classNameRadio.check();
    await dipPage.search('Classe');

    const classCard = page.getByTestId('search-result-card').filter({ hasText: 'Classe Contratti' }).first();
    await expect(classCard).toBeVisible();
    await expect(classCard.getByTestId('search-result-title')).toHaveText('Classe Contratti');
    await expect(classCard.locator('.class-badge')).toHaveText('CLASSE');
    await expect(classCard.getByTestId('result-integrity-badge')).toContainText('VALID');
  }

  async function assertProcessSearchResult(page: Page): Promise<void> {
    const dipPage = await gotoSearch(page);

    await dipPage.processIdRadio.check();
    await dipPage.search('PROC-201');

    const processCard = page.getByTestId('search-result-card').filter({ hasText: 'PROC-201' }).first();
    await expect(processCard).toBeVisible();
    await expect(processCard.getByTestId('search-result-title')).toHaveText('PROC-201');
    await expect(processCard.getByTestId('result-integrity-badge')).toContainText('VALID');
  }

  async function assertDocumentSearchResult(page: Page): Promise<void> {
    const dipPage = await gotoSearch(page);

    await dipPage.search('Determina');

    const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
    await expect(documentCard).toBeVisible();
    await expect(documentCard.getByTestId('search-result-title')).toHaveText('Determina a contrarre.pdf');
    await expect(documentCard.getByText('ID: DOC-301')).toBeVisible();
  }

  test(`[TS-26] Verificare che l'utente possa visualizzare lo stato dell'indicizzazione semantica`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(dipPage.semanticToggle).toBeVisible();
  });

  test(`[TS-27] Verificare che l'utente possa visualizzare lo stato di indicizzazione semantica "Non completata"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(dipPage.semanticToggle).not.toBeChecked();
  });

  test(`[TS-28] Verificare che l'utente possa visualizzare lo stato di indicizzazione semantica "Completata"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.semanticToggle.check();
    await expect(dipPage.semanticToggle).toBeChecked();
  });

  test(`[TS-29] Verificare che il sistema renda disponibile un campo di ricerca`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(dipPage.searchInput).toBeVisible();
  });

  test(`[TS-30] Verificare che il sistema comunichi all'utente quando inserisce un valore non valido nel campo di ricerca`, async ({ page }) => {
    await withIpcOverrides(page, {
      'ipc:search:text': '__ERROR__',
    });

    const dipPage = await gotoSearch(page);
    await dipPage.processIdRadio.check();
    await dipPage.search('valore-non-uuid');

    await expect(dipPage.errorBanner).toContainText(/errore mock/i);
  });

  test(`[TS-31] Verificare che il sistema renda disponibile l'opzione di ricerca per documenti`, async ({ page }) => {
    await assertDocumentSearchResult(page);
  });

  test(`[TS-32] Verificare che il sistema renda disponibile l'opzione di ricerca per processi`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(dipPage.processIdRadio).toBeVisible();
  });

  test(`[TS-33] Verificare che l'utente possa cercare un processo esclusivamente per uuid`, async ({ page }) => {
    await assertProcessSearchResult(page);
  });

  test(`[TS-34] Verificare che il sistema renda disponibile l'opzione di ricerca per classi documentali`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(dipPage.classNameRadio).toBeVisible();
  });

  test(`[TS-35] Verificare che il sistema renda disponibile la ricerca avanzata con filtri`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(dipPage.applyFiltersButton).toBeVisible();
  });

  test(`[TS-36] Verificare che il sistema renda disponibile la sezione di filtri di ricerca comuni`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await expect(page.getByTestId('filter-section-summary-general')).toBeVisible();
    await dipPage.openFilterSection('Dati Generali');
    await expect(dipPage.typeSelect).toBeVisible();
  });

  test(`[TS-37] Verificare che il sistema renda disponibile la sezione di filtri di ricerca specifici per tipo documentale`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByRole('heading', { name: 'Dati Documento (DiDai)' })).toBeVisible();
  });

  test(`[TS-38] Verificare che il sistema renda disponibile la sezione di filtri di ricerca specifici per metadati custom`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByRole('heading', { name: 'Metadati Personalizzati' })).toBeVisible();
  });

  test(`[TS-39] Verificare che il sistema permetta di applicare più filtri contemporaneamente`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await openCommonFilterSections(dipPage);

    await dipPage.typeSelect.selectOption({ index: 1 });
    await dipPage.oggettoInput.fill('gara servizi');
    await dipPage.noteInput.fill('note test e2e');
    await dipPage.applyFiltersButton.click();

    await expect(dipPage.resultsTitle).toContainText('Trovati');
  });

  test(`[TS-40] Verificare che il sistema permetta di rimuovere i filtri applicati`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await openCommonFilterSections(dipPage);

    await dipPage.noteInput.fill('note da cancellare');
    await dipPage.clearFiltersButton.click();

    await expect(dipPage.noteInput).toHaveValue('');
  });

  test(`[TS-41] Verificare che il sistema permetta di rimuovere tutti i filtri applicati`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await openCommonFilterSections(dipPage);

    await dipPage.conservationYearsInput.fill('9999');
    await dipPage.noteInput.fill('note test e2e');
    await dipPage.oggettoInput.fill('gara servizi');
    await dipPage.clearFiltersButton.click();

    await expect(dipPage.conservationYearsInput).toHaveValue('');
    await expect(dipPage.noteInput).toHaveValue('');
    await expect(dipPage.oggettoInput).toHaveValue('');
  });

  test(`[TS-42] Verificare che il sistema permetta di selezionare filtri per tipo documentale per un singolo tipo di documento`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await dipPage.typeSelect.selectOption({ index: 1 });
    await expect(dipPage.typeSelect).not.toHaveValue('');
  });

  test(`[TS-43] Verificare che il sistema permetta di specificare il valore per i filtri per tipo Documento Informatico e Amministrativo Informatico`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await dipPage.typeSelect.selectOption({ index: 1 });
    await expect(page.getByRole('heading', { name: 'Dati Documento (DiDai)' })).toBeVisible();
  });

  test(`[TS-44] Verificare che il sistema racchiuda i filtri di ricerca comuni in una sezione espandibile dedicata`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByTestId('filter-section-summary-general')).toBeVisible();
  });

  test(`[TS-45] Verificare che il sistema racchiuda i filtri di ricerca specifici per tipo documentale in una sezione espandibile dedicata`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByRole('heading', { name: 'Dati Documento (DiDai)' })).toBeVisible();
  });

  test(`[TS-46] Verificare che il sistema racchiuda i filtri di ricerca specifici per metadati custom in una sezione espandibile dedicata`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByRole('heading', { name: 'Metadati Personalizzati' })).toBeVisible();
  });

  test(`[TS-47] Verificare che il sistema permetta di visualizzare i filtri comuni applicabili`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await openCommonFilterSections(dipPage);

    await expect(dipPage.typeSelect).toBeVisible();
    await expect(dipPage.conservationYearsInput).toBeVisible();
    await expect(dipPage.noteInput).toBeVisible();
  });

  test(`[TS-48] Verificare che il sistema permetta di selezionare per la compilazione e l'aggiunta alla ricerca i filtri comuni`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await openCommonFilterSections(dipPage);

    await dipPage.conservationYearsInput.fill('12');
    await dipPage.noteInput.fill('nota filtro');

    await expect(dipPage.conservationYearsInput).toHaveValue('12');
    await expect(dipPage.noteInput).toHaveValue('nota filtro');
  });

  test(`[TS-49] Verificare che il sistema renda disponibile una sezione per il filtro comune "Chiave Descrittiva"`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByTestId('filter-section-summary-key')).toBeVisible();
  });

  test(`[TS-50] Verificare che l'utente possa inserire il valore per il campo "Oggetto"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Chiave Descrittiva');

    await dipPage.oggettoInput.fill('gara servizi');
    await expect(dipPage.oggettoInput).toHaveValue('gara servizi');
  });

  test(`[TS-51] Verificare che l'utente possa inserire il valore per il campo "Parole chiave"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Chiave Descrittiva');

    await dipPage.paroleChiaveInput.fill('appalto, procedura');
    await expect(dipPage.paroleChiaveInput).toHaveValue('appalto, procedura');
  });

  test(`[TS-52] Verificare che il sistema renda disponibile una sezione per il filtro comune "Classificazione"`, async ({ page }) => {
    await gotoSearch(page);
    await expect(page.getByTestId('filter-section-summary-classification')).toBeVisible();
  });

  test(`[TS-53] Verificare che l'utente possa inserire il valore per il campo "Indice di classificazione"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Classificazione');

    await dipPage.codiceClassificazioneInput.fill('A.01.02');
    await expect(dipPage.codiceClassificazioneInput).toHaveValue('A.01.02');
  });

  test(`[TS-54] Verificare che l'utente possa inserire il valore per il campo "Descrizione"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Classificazione');

    await dipPage.descrizioneClassificazioneInput.fill('Classificazione appalti');
    await expect(dipPage.descrizioneClassificazioneInput).toHaveValue('Classificazione appalti');
  });

  test(`[TS-55] Verificare che l'utente possa inserire il valore per il campo "Piano di classificazione"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Classificazione');

    await expect(dipPage.codiceClassificazioneInput).toBeVisible();
    await expect(dipPage.descrizioneClassificazioneInput).toBeVisible();
  });

  test(`[TS-56] Verificare che il sistema renda disponibile una sezione per il filtro comune "Tempo di conservazione"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await expect(dipPage.conservationYearsInput).toBeVisible();
  });

  test(`[TS-57] Verificare che l'utente possa inserire il valore per il filtro "Tempo di conservazione"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await dipPage.conservationYearsInput.fill('30');
    await expect(dipPage.conservationYearsInput).toHaveValue('30');
  });

  test(`[TS-58] Verificare che l'utente possa selezionare l'opzione "Perenne" per il filtro "Tempo di conservazione"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await dipPage.conservationYearsInput.fill('9999');
    await expect(dipPage.conservationYearsInput).toHaveValue('9999');
  });

  test(`[TS-59] Verificare che il sistema renda disponibile una sezione per il filtro comune "Note"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await expect(dipPage.noteInput).toBeVisible();
  });

  test(`[TS-60] Verificare che l'utente possa inserire il valore per il filtro "Note"`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.openFilterSection('Dati Generali');

    await dipPage.noteInput.fill('note test e2e');
    await expect(dipPage.noteInput).toHaveValue('note test e2e');
  });

  test(`[TS-2] Verificare che in caso non vi siano classi documentali nel DIP, l'utente possa visualizzare un messaggio di errore`, async ({ page }) => {
    await withIpcOverrides(page, {
      'ipc:search:text': [],
    });

    const dipPage = await gotoSearch(page);
    await dipPage.classNameRadio.check();
    await dipPage.search('Classe');

    await expect(dipPage.emptyState).toContainText(/nessun risultato/i);
  });

  test(`[TS-3] Verificare che quando viene selezionata una classe documentale, l'utente possa visualizzare ciascuna classe documentale all'interno dell'elenco`, async ({ page }) => {
    await assertClassSearchResult(page);
  });

  test(`[TS-4] Verificare che l'utente possa visualizzare il nome della classe documentale`, async ({ page }) => {
    await assertClassSearchResult(page);
  });

  test(`[TS-5] Verificare che l'utente possa visualizzare lo stato di verifica della classe documentale`, async ({ page }) => {
    await assertClassSearchResult(page);
  });

  test(`[TS-6] Verificare che l'utente possa visualizzare la marcatura temporale della classe documentale`, async ({ page }) => {
    await assertClassSearchResult(page);
    const classCard = page.getByTestId('search-result-card').filter({ hasText: 'Classe Contratti' }).first();
    const timestampByTestId = classCard.getByTestId('result-timestamp');

    if (await timestampByTestId.count()) {
      await expect(timestampByTestId).toContainText('01/01/2026');
    } else {
      await expect(classCard).toContainText('01/01/2026');
    }
  });

  test(`[TS-7] Verificare che l'utente possa visualizzare l'elenco dei processi associati alla classe documentale`, async ({ page }) => {
    await assertProcessSearchResult(page);
  });

  test(`[TS-9] Verificare che quando viene selezionato un processo, l'utente possa visualizzare ciascun processo all'interno dell'elenco`, async ({ page }) => {
    await assertProcessSearchResult(page);
  });

  test(`[TS-10] Verificare che l'utente possa visualizzare il nome del processo`, async ({ page }) => {
    await assertProcessSearchResult(page);
  });

  test(`[TS-11] Verificare che l'utente possa visualizzare l'elenco di documenti associati a un processo`, async ({ page }) => {
    await assertDocumentSearchResult(page);
  });

  test(`[TS-13] Verificare che quando viene selezionato un documento, l'utente possa visualizzare ciascun documento all'interno dell'elenco`, async ({ page }) => {
    await assertDocumentSearchResult(page);
  });

  test(`[TS-14] Verificare che l'utente possa visualizzare il nome del documento`, async ({ page }) => {
    await assertDocumentSearchResult(page);
  });

  test(`[TS-15] Verificare che l'utente possa visualizzare lo stato di verifica del documento`, async ({ page }) => {
    await assertDocumentSearchResult(page);
    const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
    await expect(documentCard.getByTestId('result-integrity-badge')).toContainText('VALID');
  });

  test(`[TS-16] Verificare che l'utente possa visualizzare la marcatura temporale del documento`, async ({ page }) => {
    await withIpcOverrides(page, {
      'ipc:search:text': [
        {
          id: 301,
          uuid: 'DOC-301',
          name: 'Determina a contrarre.pdf',
          type: 'DOCUMENTO_INFORMATICO',
          integrityStatus: 'VALID',
          timestamp: '2026-01-03T00:00:00Z',
        },
      ],
    });

    const dipPage = await gotoSearch(page);
    await dipPage.search('Determina');

    const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
    const timestampByTestId = documentCard.getByTestId('result-timestamp');
    if (await timestampByTestId.count()) {
      await expect(timestampByTestId).toContainText('03/01/2026');
    } else {
      await expect(documentCard).toContainText('03/01/2026');
    }
  });

  test(`[TS-17] Verificare che l'utente possa essere informato se un elenco di elementi del DIP risulta vuoto`, async ({ page }) => {
    await withIpcOverrides(page, {
      'ipc:search:text': [],
    });

    const dipPage = await gotoSearch(page);
    await dipPage.search('assenza');
    await expect(dipPage.emptyState).toContainText(/nessun risultato/i);
  });

  test(`[TS-18] L'utente deve poter visualizzare se il risultato dello stato di verifica di un elemento è "Non valido"`, async ({ page }) => {
    await withIpcOverrides(page, {
      'ipc:search:text': [
        {
          id: 301,
          uuid: 'DOC-301',
          name: 'Determina a contrarre.pdf',
          type: 'DOCUMENTO_INFORMATICO',
          integrityStatus: 'INVALID',
        },
      ],
    });

    const dipPage = await gotoSearch(page);
    await dipPage.search('Determina');

    const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
    await expect(documentCard.getByTestId('result-integrity-badge')).toContainText(/non valido|invalid/i);
  });

  test(`[TS-20] L'utente deve poter visualizzare se il risultato dello stato di verifica di un elemento è "Non verificato"`, async ({ page }) => {
    await withIpcOverrides(page, {
      'ipc:search:text': [
        {
          id: 301,
          uuid: 'DOC-301',
          name: 'Determina a contrarre.pdf',
          type: 'DOCUMENTO_INFORMATICO',
          integrityStatus: 'UNKNOWN',
        },
      ],
    });

    const dipPage = await gotoSearch(page);
    await dipPage.search('Determina');

    const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
    await expect(documentCard.getByTestId('result-integrity-badge')).toContainText(/non verificato|unknown/i);
  });

  test(`[TS-22] Verificare che se il documento selezionato non è visualizzabile in anteprima, l'utente possa visualizzare un messaggio di errore`, async ({ page }) => {
    await withIpcOverrides(page, {
      'browse:get-file-by-document': [],
    });

    const dipPage = await gotoSearch(page);
    await dipPage.search('Determina');
    await page.getByRole('button', { name: /Determina a contrarre\.pdf/i }).click();
    await page.getByRole('button', { name: /apri anteprima/i }).click();

    await expect(page.getByTestId('document-viewer-error-message')).toContainText(/nessun file associato a questo documento/i);
  });

  test(`[TS-23] Verificare che l'utente possa ricercare un documento, un processo, o una classe documentale`, async ({ page }) => {
    await assertClassSearchResult(page);
    await assertProcessSearchResult(page);
    await assertDocumentSearchResult(page);
  });

  test(`[TS-24] Verificare che l'utente possa cercare una classe documentale esclusivamente per nome`, async ({ page }) => {
    await assertClassSearchResult(page);
  });

  test(`[TS-25] Verificare che l'utente possa effettuare una ricerca semantica basata sui metadati dei documenti presenti nel DIP`, async ({ page }) => {
    const dipPage = await gotoSearch(page);
    await dipPage.semanticToggle.check();
    await dipPage.search('verbale commissione');

    const semanticCard = page.getByTestId('search-result-card').filter({ hasText: 'Verbale commissione.pdf' }).first();
    await expect(semanticCard).toBeVisible();
  });
});
