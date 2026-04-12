import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'node:path';
import { DocumentMetadataPage } from './document-metadata.page';
import { SessionDetailsPage } from './session-details.page';
import { SubjectAnagraphicPage } from './subject-anagraphic.page';

test.describe('Sessioni e Anagrafica Soggetti - Fullstack', () => {
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

  async function openFirstDocumentDetail(): Promise<void> {
    const treeToggles = page.getByTestId('dip-tree-toggle');
    const treeNodes = page.getByTestId('dip-tree-node');

    await treeToggles.nth(0).click();
    await treeToggles.nth(1).click();
    await treeToggles.nth(2).click();
    await treeNodes.nth(3).click();
  }

  test('[FULLSTACK] Happy path caricamento metadati documento e sessione', async () => {
    await ensureMainPageReady();
    await openFirstDocumentDetail();

    const documentMetadataPage = new DocumentMetadataPage(page);
    const sessionDetailsPage = new SessionDetailsPage(page);

    await expect(documentMetadataPage.detailTitle).toBeVisible();
    await expect(documentMetadataPage.mainMetadataHeading).toBeVisible();
    await expect(
      sessionDetailsPage.conservationProcessHeading.or(documentMetadataPage.additionalMetadataHeading),
    ).toBeVisible();
  });

  test('[FULLSTACK] Happy path caricamento classificazione e sezione soggetti', async () => {
    await ensureMainPageReady();
    await openFirstDocumentDetail();

    const documentMetadataPage = new DocumentMetadataPage(page);
    const subjectAnagraphicPage = new SubjectAnagraphicPage(page);

    await expect(documentMetadataPage.classificationHeading).toBeVisible();
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Indice:')).toBeVisible();
    await expect(subjectAnagraphicPage.subjectsHeading).toBeVisible();
  });
});
