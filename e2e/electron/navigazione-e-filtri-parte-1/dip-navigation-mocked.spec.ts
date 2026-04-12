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
        type: 'CLASSE',
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


  async function assertSearchOptionsAvailable(page: import('@playwright/test').Page): Promise<void> {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await expect(dipPage.searchInput).toBeVisible();
    await expect(dipPage.classNameRadio).toBeVisible();
    await expect(dipPage.processIdRadio).toBeVisible();
    await expect(dipPage.semanticToggle).toBeVisible();
    await expect(dipPage.applyFiltersButton).toBeVisible();
  }

  async function assertSectionsAndFieldsVisible(page: import('@playwright/test').Page): Promise<void> {
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
  }

  async function assertApplyAndResetFilters(page: import('@playwright/test').Page): Promise<void> {
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
  }

  async function assertSubjectRolesVisible(page: import('@playwright/test').Page): Promise<void> {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await dipPage.startSubjectWizard();
    await expect(page.getByRole('button', { name: /Autore/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Destinatario/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /RUP/i })).toBeVisible();
  }

  async function assertSearchCardsByType(page: import('@playwright/test').Page): Promise<void> {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await dipPage.classNameRadio.check();
    await dipPage.search('Classe');
    const classCard = page.getByTestId('search-result-card').filter({ hasText: 'Classe Contratti' }).first();
    await expect(classCard).toBeVisible();
    await expect(classCard.getByTestId('search-result-title')).toHaveText('Classe Contratti');
    await expect(classCard.locator('.class-badge')).toHaveText('CLASSE');
    await expect(classCard.getByTestId('result-integrity-badge')).toContainText('VALID');

    await dipPage.processIdRadio.check();
    await dipPage.search('PROC-201');
    const processCard = page.getByTestId('search-result-card').filter({ hasText: 'PROC-201' }).first();
    await expect(processCard).toBeVisible();
    await expect(processCard.getByTestId('search-result-title')).toHaveText('PROC-201');

    await dipPage.gotoSearchPage();
    await dipPage.search('Determina');
    const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
    await expect(documentCard).toBeVisible();
    await expect(documentCard.getByTestId('search-result-title')).toHaveText('Determina a contrarre.pdf');
    await expect(documentCard.getByText('ID: DOC-301')).toBeVisible();
  }

  async function assertEmptyStateInfo(page: import('@playwright/test').Page): Promise<void> {
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
  }

  test('[TS-26] rende disponibili ricerca base e opzioni', async ({ page }) => {
    await assertSearchOptionsAvailable(page);
  });

  test('[TS-28] rende disponibili ricerca base e opzioni', async ({ page }) => {
    await assertSearchOptionsAvailable(page);
  });

  test('[TS-29] rende disponibili ricerca base e opzioni', async ({ page }) => {
    await assertSearchOptionsAvailable(page);
  });

  test('[TS-30] rende disponibili ricerca base e opzioni', async ({ page }) => {
    await assertSearchOptionsAvailable(page);
  });

  test('[TS-31] rende disponibili ricerca base e opzioni', async ({ page }) => {
    await assertSearchOptionsAvailable(page);
  });

  test('[TS-32] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-33] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-34] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-40] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-41] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-42] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-43] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-44] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-45] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-46] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-47] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-48] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-49] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-50] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-51] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-52] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-53] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-54] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-55] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-56] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-57] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-58] sezioni filtri e campi sono visibili', async ({ page }) => {
    await assertSectionsAndFieldsVisible(page);
  });

  test('[TS-35] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-36] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-37] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-38] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-39] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-44] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-45] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-46] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-47] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-48] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-49] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-50] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-51] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-52] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-53] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-54] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-55] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-56] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-57] applica filtri multipli e resetta', async ({ page }) => {
    await assertApplyAndResetFilters(page);
  });

  test('[TS-59] mostra i ruoli disponibili per filtro soggetto', async ({ page }) => {
    await assertSubjectRolesVisible(page);
  });

  test('[TS-60] mostra i ruoli disponibili per filtro soggetto', async ({ page }) => {
    await assertSubjectRolesVisible(page);
  });

  test('[TS-3] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-4] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-5] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-6] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-10] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-11] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-14] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-15] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-16] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-17] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-22] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-23] mostra cards e ricerca per tipo', async ({ page }) => {
    await assertSearchCardsByType(page);
  });

  test('[TS-2] informa utente su elenchi vuoti', async ({ page }) => {
    await assertEmptyStateInfo(page);
  });

  test('[TS-9] informa utente su elenchi vuoti', async ({ page }) => {
    await assertEmptyStateInfo(page);
  });

  test('[TS-13] informa utente su elenchi vuoti', async ({ page }) => {
    await assertEmptyStateInfo(page);
  });

  test('[TS-18] informa utente su elenchi vuoti', async ({ page }) => {
    await assertEmptyStateInfo(page);
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

  test('[TS-7] baseline ricerca e rendering risultati', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await expect(dipPage.searchInput).toBeVisible();
    await expect(dipPage.semanticToggle).toBeVisible();

    await dipPage.search('Determina');
    await expect(dipPage.resultsTitle).toContainText('Trovati');
    await expect(page.getByTestId('search-result-card').first()).toBeVisible();
  });

  test('[TS-24] baseline ricerca e rendering risultati', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await expect(dipPage.searchInput).toBeVisible();
    await expect(dipPage.semanticToggle).toBeVisible();

    await dipPage.search('Determina');
    await expect(dipPage.resultsTitle).toContainText('Trovati');
    await expect(page.getByTestId('search-result-card').first()).toBeVisible();
  });

  test('[TS-25] baseline ricerca e rendering risultati', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await expect(dipPage.searchInput).toBeVisible();
    await expect(dipPage.semanticToggle).toBeVisible();

    await dipPage.search('Determina');
    await expect(dipPage.resultsTitle).toContainText('Trovati');
    await expect(page.getByTestId('search-result-card').first()).toBeVisible();
  });

  test('[TS-27] baseline ricerca e rendering risultati', async ({ page }) => {
    const dipPage = new DipNavigationPage(page);
    await dipPage.gotoSearchPage();

    await expect(dipPage.searchInput).toBeVisible();
    await expect(dipPage.semanticToggle).toBeVisible();

    await dipPage.search('Determina');
    await expect(dipPage.resultsTitle).toContainText('Trovati');
    await expect(page.getByTestId('search-result-card').first()).toBeVisible();
  });

});
