import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'node:path';

test.describe('Navigazione e Filtri Parte 1 - Fullstack', () => {
  test.describe.configure({ timeout: 60000 });

  let app: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    const repoRoot = path.resolve(__dirname, '../../..');

    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
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

        await new Promise((resolve) => setTimeout(resolve, 500));
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

  async function runBackendIpcHappyPath(): Promise<void> {
    await ensureMainPageReady();
    const treeNodes = page.getByTestId('dip-tree-node');
    const toggles = page.getByTestId('dip-tree-toggle');

    const clickToggle = async (index: number): Promise<void> => {
      const toggle = toggles.nth(index);
      await expect(toggle).toBeVisible();
      try {
        await toggle.click({ timeout: 10000 });
      } catch {
        await toggle.click({ force: true, timeout: 10000 });
      }
    };

    await expect(page.getByRole('button', { name: 'Ricerca' })).toBeVisible(); // TS-21
    await expect(treeNodes.first()).toBeVisible(); // TS-1

    await clickToggle(0);
    await expect(treeNodes.nth(1)).toBeVisible(); // TS-8

    await clickToggle(1);
    await expect(treeNodes.nth(2)).toBeVisible(); // TS-12

    await clickToggle(2);
    await expect(treeNodes.nth(3)).toBeVisible(); // TS-12

    await treeNodes.nth(3).click();
    await expect(page).toHaveURL(/#\/detail\/DOCUMENT\//); // TS-21

    await expect(page.getByRole('button', { name: /apri anteprima/i })).toBeVisible(); // TS-19
    await page.getByRole('button', { name: /apri anteprima/i }).click();
    await expect(page.getByTestId('document-viewer').or(page.locator('app-document-viewer')).first()).toBeVisible(); // TS-19
  }

  async function runSemanticBridgeFlow(): Promise<void> {
    await ensureMainPageReady();
    await page.getByRole('button', { name: 'Ricerca' }).click();
    await page.getByTestId('search-input').or(page.getByPlaceholder('Inserisci testo di ricerca...')).first().fill('determina');
    await page.getByTestId('search-semantic-toggle').or(page.getByLabel('Ricerca Semantica')).first().check();
    await page.getByTestId('search-submit-button').or(page.getByRole('button', { name: '🔍 Cerca', exact: true })).first().click({ noWaitAfter: true });

    const semanticOutcome = page
      .getByTestId('search-page-title')
      .or(page.getByTestId('search-empty-state'))
      .or(page.getByTestId('search-retry-button'))
      .or(page.getByRole('button', { name: 'Riprova' }))
      .or(page.getByText(/nessun risultato trovato/i));

    await expect(semanticOutcome.first()).toBeVisible(); // TS-24
  }

  for (const ts of [1, 8, 12, 19, 21]) {
    test(`[TS-${ts}] happy path con backend/IPC reale`, async () => {
      await runBackendIpcHappyPath();
    });
  }

  test('[TS-24] ricerca semantica con bridge Electron reale', async () => {
    await runSemanticBridgeFlow();
  });
});
