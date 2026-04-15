import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'node:path';
import { TechnicalMetadataPage } from './technical-metadata.page';

test.describe('Dettagli Tecnici e Procedimenti Finali - Fullstack', () => {
  test.describe.configure({ timeout: 60000 });

  let app: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    const repoRoot = path.resolve(__dirname, '../../..');

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

  async function openFirstDocumentDetailFromTree(): Promise<void> {
    const treeToggles = page.getByTestId('dip-tree-toggle');
    const treeNodes = page.getByTestId('dip-tree-node');

    await treeToggles.nth(0).click();
    await treeToggles.nth(1).click();
    await treeToggles.nth(2).click();
    await treeNodes.nth(3).click();
  }

  test(`[TS-371] Verificare che l'utente possa visualizzare i dati di registrazione del documento selezionato`, async () => {
    await ensureMainPageReady();
    await openFirstDocumentDetailFromTree();

    const technicalMetadataPage = new TechnicalMetadataPage(page);

    await expect(technicalMetadataPage.documentMetadataHeading).toBeVisible();
    await expect(technicalMetadataPage.documentNome).toBeVisible();
  });

  test(`[TS-372] Verificare che l'utente possa visualizzare informazioni di classificazione del documento selezionato`, async () => {
    await ensureMainPageReady();
    await openFirstDocumentDetailFromTree();

    const technicalMetadataPage = new TechnicalMetadataPage(page);

    await expect(technicalMetadataPage.classificationHeading).toBeVisible();
    await expect(technicalMetadataPage.classificationIndice).toBeVisible();
  });
});
