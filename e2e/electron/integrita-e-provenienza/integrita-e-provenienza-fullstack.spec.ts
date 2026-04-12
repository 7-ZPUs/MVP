import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'node:path';
import { IntegrityPage } from './integrity.page';
import { AipDetailsPage } from './aip-details.page';

test.describe('Integrita e Provenienza - Fullstack', () => {
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

  test('[TS-122] avviare la verifica dell intero DIP', async () => {
    await ensureMainPageReady();

    const integrityPage = new IntegrityPage(page);
    await integrityPage.gotoDashboard();
    await integrityPage.startGlobalVerification();

    await expect(integrityPage.dashboardTitle).toBeVisible();
    await expect(integrityPage.startVerificationButton).toBeVisible();
  });

  test('[TS-128] avviare la verifica dell integrita di un singolo documento', async () => {
    await ensureMainPageReady();

    const treeToggles = page.getByTestId('dip-tree-toggle');
    const treeNodes = page.getByTestId('dip-tree-node');

    await treeToggles.nth(0).click();
    await treeToggles.nth(1).click();
    await treeToggles.nth(2).click();
    await treeNodes.nth(3).click();

    const aipDetailsPage = new AipDetailsPage(page);
    await expect(aipDetailsPage.verifyIntegrityButton).toBeVisible();
    await aipDetailsPage.verifyIntegrityButton.click();

    await expect(aipDetailsPage.verifyIntegrityButton).toBeVisible();
  });
});
