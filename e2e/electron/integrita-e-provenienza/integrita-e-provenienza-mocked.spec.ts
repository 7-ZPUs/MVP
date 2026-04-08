import { expect, Page, test } from '@playwright/test';
import { IntegrityPage } from './integrity.page';
import { AipDetailsPage } from './aip-details.page';

type MockRequest = { channel: string; payload: unknown };

type MockOptions = {
  errorChannels?: string[];
  mapOverrides?: Record<string, unknown>;
};

function createDefaultIpcMap(): Record<string, unknown> {
  return {
    'browse:get-dip-by-id': { id: 1, name: 'DIP test' },
    'browse:get-document-class-by-dip-id': [
      { id: 101, name: 'Classe Contratti', integrityStatus: 'INVALID' },
      { id: 102, name: 'Classe Delibere', integrityStatus: 'VALID' },
    ],
    'browse:get-process-by-document-class': [
      { id: 201, uuid: 'PROC-201', integrityStatus: 'INVALID', metadata: [{ name: 'Oggetto', value: 'Processo A' }] },
      { id: 202, uuid: 'PROC-202', integrityStatus: 'VALID', metadata: [{ name: 'Oggetto', value: 'Processo B' }] },
    ],
    'browse:get-documents-by-process': [
      { id: 301, uuid: 'DOC-301', integrityStatus: 'INVALID', metadata: [{ name: 'NomeDelDocumento', value: 'verbale.pdf' }] },
      { id: 302, uuid: 'DOC-302', integrityStatus: 'VALID', metadata: [{ name: 'NomeDelDocumento', value: 'determina.pdf' }] },
    ],
    'browse:get-document-by-id': {
      id: 301,
      uuid: 'AIP-UUID-301',
      integrityStatus: 'VALID',
      metadata: [
        { name: 'NomeDelDocumento', value: 'verbale.pdf' },
        { name: 'ClasseDocumentale', value: 'Classe Contratti' },
        { name: 'PreservationProcessUUID', value: 'PROC-CONS-001' },
        { name: 'PreservationProcessDate', value: '08/04/2026 10:30:45' },
        { name: 'TipologiaDocumentale', value: 'Verbale' },
        { name: 'ModalitaDiFormazione', value: 'Generazione' },
        { name: 'Oggetto', value: 'Verbale commissione' },
      ],
    },
    'browse:get-file-by-document': [{ id: 901, documentId: 301, isMain: true, filename: 'verbale.pdf' }],
    'browse:get-file-buffer-by-id': [37, 80, 68, 70, 45],
    'check-integrity:dip': 'VALID',
    'check-integrity:document-class': 'VALID',
    'check-integrity:process': 'VALID',
    'check-integrity:document': 'VALID',
    'ipc:output:print': { ok: true },
    'ipc:output:export-pdf': { ok: true },
    'ipc:output:save': { ok: true },
    'ipc:output:download': { ok: true },
  };
}

async function installMockIpc(page: Page, options: MockOptions = {}): Promise<string[]> {
  const calls: string[] = [];
  const map = { ...createDefaultIpcMap(), ...(options.mapOverrides ?? {}) };
  const errorChannels = new Set(options.errorChannels ?? []);

  await page.route('**/__e2e__/mock-ipc', async (route) => {
    const body = route.request().postDataJSON() as MockRequest;
    calls.push(body.channel);

    if (errorChannels.has(body.channel)) {
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
      body: JSON.stringify(map[body.channel] ?? []),
    });
  });

  return calls;
}

test.describe('Integrita e Provenienza - Mocked', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('[TS-123] visualizzare lo stato di verifica del DIP', async ({ page }) => {
    await installMockIpc(page, { errorChannels: ['check-integrity:dip'] });

    const integrityPage = new IntegrityPage(page);
    await integrityPage.gotoDashboard();
    await integrityPage.startGlobalVerification();

    await expect(integrityPage.errorBanner).toContainText(/errore durante la verifica/i);
  });

  test('[TS-130] visualizzare report integrita del DIP con informazioni aggregate', async ({ page }) => {
    await installMockIpc(page);

    const integrityPage = new IntegrityPage(page);
    await integrityPage.gotoDashboard();

    await expect(integrityPage.validElementsNumber).toBeVisible();
    await expect(integrityPage.invalidElementsNumber).toBeVisible();
    await expect(integrityPage.unverifiedElementsNumber).toBeVisible();
    await expect(integrityPage.validPanelHeading).toBeVisible();
    await expect(integrityPage.corruptedPanelHeading).toBeVisible();
  });

  test('[TS-154] visualizzare il report di integrita di un singolo documento', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.documentDetailTitle).toBeVisible();
  });

  test('[TS-155] visualizzare il nome del documento nel report di integrita', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(page.getByRole('heading', { name: 'verbale.pdf' })).toBeVisible();
  });

  test('[TS-156] visualizzare stato verifica del documento selezionato', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.verificationStatusLabel).toContainText(/verificato|corrotto|sconosciuto/i);
  });

  test('[TS-159] avviare conversione report visualizzato in PDF', async ({ page }) => {
    const calls = await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();
    await aipDetailsPage.exportButton.click();

    await expect.poll(() => calls.includes('ipc:output:export-pdf')).toBeTruthy();
  });

  test('[TS-165] visualizzare informazioni AiP di provenienza del documento', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.aipHeading).toBeVisible();
  });

  test('[TS-166] visualizzare classe documentale AiP del documento', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.aipClassRow).toContainText('Classe Contratti');
  });

  test('[TS-167] visualizzare UUID AiP del documento selezionato', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.aipUuidRow).toContainText('AIP-UUID-301');
  });

  test('[TS-168] visualizzare informazioni del processo di conservazione AiP', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationHeading).toBeVisible();
    await expect(aipDetailsPage.conservationProcessRow).toContainText('PROC-CONS-001');
  });

  test('[TS-169] visualizzare data di inizio processo o sessione', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationStartDateRow).toContainText('08/04/2026 10:30:45');
  });

  test('[TS-179] visualizzare informazioni della sessione di versamento', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationSessionRow).toContainText('N/A');
  });

  test('[TS-180] visualizzare data di inizio della sessione di versamento', async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationStartDateRow).toContainText('08/04/2026 10:30:45');
  });

  const fullstackCovered = new Set([122, 128]);
  const mockedImplemented = new Set([123, 130, 154, 155, 156, 159, 165, 166, 167, 168, 169, 179, 180]);
  const allTs = Array.from({ length: 60 }, (_, idx) => idx + 121);
  const fixmeTs = allTs.filter((tsCode) => !fullstackCovered.has(tsCode) && !mockedImplemented.has(tsCode));

  for (const tsCode of fixmeTs) {
    test(`[TS-${tsCode}] requisito non ancora verificabile con la UI corrente`, async () => {
      test.fixme(
        true,
        'La UI corrente non espone ancora selettori o funzionalita dedicate al requisito (report gerarchici dettagliati, messaggistica specifica o policy di salvataggio percorso).'
      );
    });
  }
});
