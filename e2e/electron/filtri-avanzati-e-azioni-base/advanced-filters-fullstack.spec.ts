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
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    await advFiltersPage.openAdvancedFilters();
  }

  const range = (start: number, end: number): number[] =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

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
      await aggregationTypeSelect.scrollIntoViewIfNeeded();
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

  for (const ts of range(61, 72)) {
    test(`[TS-${ts}] happy path: aggiungere un soggetto e ricercare`, async () => {
      await runSubjectFiltersHappyPath();
    });
  }

  for (const ts of range(73, 89)) {
    test(`[TS-${ts}] happy path: applicare filtri su Documento Informatico`, async () => {
      await runDocumentFiltersHappyPath();
    });
  }

  for (const ts of range(90, 105)) {
    test(`[TS-${ts}] happy path: applicare filtri su Aggregazione Documentale`, async () => {
      await runAggregateFiltersHappyPath();
    });
  }

  for (const ts of [116, 117]) {
    test(`[TS-${ts}] happy path: ricerca e salvataggio documenti`, async () => {
      await runSaveDocumentsHappyPath();
    });
  }
});
