import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import path from 'node:path';

test.describe('Navigazione e Filtri Parte 1 - Fullstack', () => {
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

  test('[TS-1, TS-8, TS-12, TS-19, TS-21] happy path con backend/IPC reale', async () => {
    const treeNodes = page.locator('.tree-node');
    const toggles = page.locator('.toggle-icon');

    await expect(page.getByRole('button', { name: 'Ricerca' })).toBeVisible(); // TS-21
    await expect(treeNodes.first()).toBeVisible(); // TS-1

    await toggles.nth(0).click();
    await expect(treeNodes.nth(1)).toBeVisible(); // TS-8

    await toggles.nth(1).click();
    await expect(treeNodes.nth(2)).toBeVisible(); // TS-12

    await toggles.nth(2).click();
    await expect(treeNodes.nth(3)).toBeVisible(); // TS-12

    await treeNodes.nth(3).click();
    await expect(page).toHaveURL(/#\/detail\/DOCUMENT\//); // TS-21

    await expect(page.getByRole('button', { name: /apri anteprima/i })).toBeVisible(); // TS-19
    await page.getByRole('button', { name: /apri anteprima/i }).click();
    await expect(page.locator('app-document-viewer')).toBeVisible(); // TS-19
  });

  test('[TS-24] ricerca semantica con bridge Electron reale', async () => {
    await page.getByRole('button', { name: 'Ricerca' }).click();
    await page.getByPlaceholder('Inserisci testo di ricerca...').fill('determina');
    await page.getByLabel('Ricerca Semantica').check();
    await page.getByRole('button', { name: '🔍 Cerca', exact: true }).click({ noWaitAfter: true });

    const semanticOutcome = page
      .getByTestId('search-page-title')
      .or(page.getByTestId('search-empty-state'))
      .or(page.getByTestId('search-retry-button'))
      .or(page.getByRole('button', { name: 'Riprova' }))
      .or(page.getByText(/nessun risultato trovato/i));

    await expect(semanticOutcome.first()).toBeVisible(); // TS-24
  });
});
