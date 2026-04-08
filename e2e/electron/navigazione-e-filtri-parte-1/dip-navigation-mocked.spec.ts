import { expect, test } from '@playwright/test';
import { DipNavigationPage } from './dip-navigation.page';

type MockRequest = { channel: string; payload: unknown };

function createDefaultIpcMap() {
  return {
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
        type: 'CLASSE_DOCUMENTALE',
        integrityStatus: 'VALID',
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

  test('[TS-26, TS-28, TS-29, TS-30, TS-31] rende disponibili ricerca base e opzioni', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await expect(dipPage.searchInput).toBeVisible();
    await expect(dipPage.freeTextRadio).toBeVisible();
    await expect(dipPage.classNameRadio).toBeVisible();
    await expect(dipPage.processIdRadio).toBeVisible();
    await expect(dipPage.semanticToggle).toBeVisible();
    await expect(dipPage.applyFiltersButton).toBeVisible();
  });

  test('[TS-32..TS-34, TS-40..TS-42, TS-43..TS-58] sezioni filtri e campi sono visibili', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await dipPage.openFilterSection('Dati Generali');
    await dipPage.openFilterSection('Chiave Descrittiva');
    await dipPage.openFilterSection('Classificazione');

    await expect(dipPage.typeSelect).toBeVisible();
    await expect(dipPage.conservationYearsInput).toBeVisible();
    await expect(dipPage.noteInput).toBeVisible();
    await expect(dipPage.oggettoInput).toBeVisible();
    await expect(dipPage.paroleChiaveInput).toBeVisible();
    await expect(dipPage.codiceClassificazioneInput).toBeVisible();
    await expect(dipPage.descrizioneClassificazioneInput).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Dati Documento (DiDai)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dati di Aggregazione' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Metadati Personalizzati' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Soggetti' })).toBeVisible();
  });

  test('[TS-35, TS-36, TS-37, TS-38, TS-39, TS-44..TS-57] applica filtri multipli e resetta', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await dipPage.openFilterSection('Dati Generali');
    await dipPage.openFilterSection('Chiave Descrittiva');
    await dipPage.openFilterSection('Classificazione');

    await dipPage.typeSelect.selectOption({ index: 1 });
    await dipPage.conservationYearsInput.fill('9999');
    await dipPage.noteInput.fill('note test e2e');
    await dipPage.oggettoInput.fill('gara servizi');
    await dipPage.paroleChiaveInput.fill('appalto, procedura');
    await dipPage.codiceClassificazioneInput.fill('A.01.02');
    await dipPage.descrizioneClassificazioneInput.fill('Classificazione appalti');

    await dipPage.applyFiltersButton.click();
    await expect(dipPage.resultsTitle).toContainText('Trovati');

    await dipPage.clearFiltersButton.click();
    await expect(dipPage.conservationYearsInput).toHaveValue('');
    await expect(dipPage.noteInput).toHaveValue('');
    await expect(dipPage.oggettoInput).toHaveValue('');
  });

  test('[TS-59, TS-60] mostra i ruoli disponibili per filtro soggetto', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await dipPage.startSubjectWizard();
    await expect(page.getByRole('button', { name: /Autore/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Destinatario/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /RUP/i })).toBeVisible();
  });

  test('[TS-3, TS-4, TS-5, TS-6, TS-10, TS-11, TS-14, TS-15, TS-16, TS-17, TS-22, TS-23] mostra cards e ricerca per tipo', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await dipPage.classNameRadio.check();
    await dipPage.search('Classe');

    await expect(page.getByRole('heading', { name: 'Classe Contratti' })).toBeVisible();
    await expect(page.getByText('CLASSE_DOCUMENTALE')).toBeVisible();
    await expect(page.getByTestId('result-integrity-badge').first()).toContainText('VALID');

    await dipPage.processIdRadio.check();
    await dipPage.search('PROC-201');

    await expect(page.getByRole('heading', { name: 'Procedura Appalto 2026' })).toBeVisible();
    await expect(page.getByText('ID Processo: PROC-201')).toBeVisible();

    await dipPage.freeTextRadio.check();
    await dipPage.search('Determina');

    await expect(page.getByRole('heading', { name: 'Determina a contrarre.pdf' })).toBeVisible();
    await expect(page.getByText('ID: DOC-301')).toBeVisible();
  });

  test('[TS-2, TS-9, TS-13, TS-18] informa utente su elenchi vuoti', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);

    await page.route('**/__e2e__/mock-ipc', async (route) => {
      const body = route.request().postDataJSON() as MockRequest;
      const emptyResponses: Record<string, unknown> = {
        'browse:get-dip-by-id': { id: 1, name: 'DIP test' },
        'browse:get-document-class-by-dip-id': [],
        'browse:get-process-by-document-class': [],
        'browse:get-documents-by-process': [],
        'ipc:search:text': [],
        'ipc:search:advanced': [],
        'ipc:search:semantic': [],
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyResponses[body.channel] ?? []),
      });
    });

    await dipPage.gotoSearchPage();
    await dipPage.search('assenza');
    await expect(dipPage.emptyState).toContainText(/nessun/i);
  });

  test('[TS-20] errore se anteprima documento non disponibile', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);

    await page.route('**/__e2e__/mock-ipc', async (route) => {
      const body = route.request().postDataJSON() as MockRequest;
      const map = createDefaultIpcMap();
      map['browse:get-file-by-document'] = [];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(map[body.channel] ?? []),
      });
    });

    await dipPage.gotoSearchPage();
    await dipPage.search('Determina');
    await page.getByRole('button', { name: /Determina a contrarre\.pdf/i }).click();
    await page.getByRole('button', { name: /apri anteprima/i }).click();

    await expect(page.getByTestId('document-viewer-error-message')).toContainText(/nessun file associato a questo documento/i);
  });

  test('[TS-7, TS-24, TS-25, TS-27] tracciati come non implementati in UI corrente', async () => {
    test.fixme(true, 'Requisiti non verificabili end-to-end con la UI attuale: timestamp in card, stato indicizzazione semantic visibile, validazione search input esplicita.');
  });
});
