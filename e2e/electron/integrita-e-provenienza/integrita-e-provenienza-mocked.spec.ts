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
    'app:bootstrap-status': { state: 'success' },
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
    'browse:get-file-by-id': { id: 901, documentId: 301, isMain: true, filename: 'verbale.pdf' },
    'browse:get-file-buffer-by-id': [37, 80, 68, 70, 45],
    'file:save-dialog': { canceled: false, filePath: '/tmp/verbale.pdf' },
    'file:download': { success: true },
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

  test(`[TS-186] Verificare che l'utente possa visualizzare lo stato di verifica del DIP`, async ({ page }) => {
    await installMockIpc(page, { errorChannels: ['check-integrity:dip'] });

    const integrityPage = new IntegrityPage(page);
    await integrityPage.gotoDashboard();
    await integrityPage.startGlobalVerification();

    await expect
      .poll(
        async () => {
          if (await integrityPage.errorBanner.isVisible().catch(() => false)) {
            return 'error';
          }
          if (await integrityPage.validElementsNumber.isVisible().catch(() => false)) {
            return 'state';
          }
          return 'pending';
        },
        { timeout: 10000 },
      )
      .not.toBe('pending');
  });

  test(`[TS-193] Verificare che l'utente possa visualizzare il report di integrità del DIP completo con le informazioni aggregate`, async ({ page }) => {
    await installMockIpc(page);

    const integrityPage = new IntegrityPage(page);
    await integrityPage.gotoDashboard();

    await expect(integrityPage.validElementsNumber).toBeVisible();
    await expect(integrityPage.invalidElementsNumber).toBeVisible();
    await expect(integrityPage.unverifiedElementsNumber).toBeVisible();
    await expect(integrityPage.validPanelHeading).toBeVisible();
  });

  test(`[TS-217] Verificare che l'utente possa visualizzare il report di integrità di un singolo documento`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.documentDetailTitle).toBeVisible();
  });

  test(`[TS-218] Verificare che l'utente possa visualizzare il nome del documento all'interno del report di integrità`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(page.getByRole('heading', { name: 'verbale.pdf' })).toBeVisible();
  });

  test(`[TS-219] Verificare che l'utente possa visualizzare lo stato della verifica (Valido / Non Valido) per il documento selezionato`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.verificationStatusLabel).toContainText(/verificato|corrotto|sconosciuto/i);
  });

  test(`[TS-222] Verificare che l'utente possa avviare la conversione del report di verifica visualizzato in formato PDF`, async ({ page }) => {
    const calls = await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();
    await aipDetailsPage.exportButton.click();

    await expect.poll(() => calls.includes('file:download')).toBeTruthy();
  });

  test(`[TS-228] Verificare che l'utente possa visualizzare le informazioni dell'AiP di provenienza di un documento selezionato`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.aipHeading).toBeVisible();
  });

  test(`[TS-229] Verificare che l'utente possa visualizzare la classe documentale di appartenenza dell'AiP relativo al documento selezionato`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.aipClassRow).toContainText('Classe Contratti');
  });

  test(`[TS-230] Verificare che l'utente possa visualizzare lo UUID dell'AiP relativo al documento selezionato`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.aipUuidRow).toContainText('AIP-UUID-301');
  });

  test(`[TS-231] Verificare che l'utente possa visualizzare le informazioni del processo di conservazione dell'AiP`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationHeading).toBeVisible();
    await expect(aipDetailsPage.conservationProcessRow).toContainText('PROC-CONS-001');
  });

  test(`[TS-232] Verificare che l'utente possa visualizzare la data di inizio di un processo o sessione`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationStartDateRow).toContainText('08/04/2026 10:30:45');
  });

  test(`[TS-242] Verificare che l'utente possa visualizzare le informazioni della sessione di versamento del processo di conservazione selezionato`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationSessionRow).toContainText('N/A');
  });

  test(`[TS-243] Verificare che l'utente possa visualizzare la data di inizio della sessione di versamento`, async ({ page }) => {
    await installMockIpc(page);

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.conservationStartDateRow).toContainText('08/04/2026 10:30:45');
  });

  async function assertBaselineIntegrityAndDetail(page: Page): Promise<void> {
    await installMockIpc(page);

    const integrityPage = new IntegrityPage(page);
    await integrityPage.gotoDashboard();

    await expect(integrityPage.startVerificationButton).toBeVisible();
    await expect(integrityPage.validElementsNumber).toBeVisible();
    await expect(integrityPage.invalidElementsNumber).toBeVisible();
    await expect(integrityPage.unverifiedElementsNumber).toBeVisible();
    await expect(integrityPage.validPanelHeading).toBeVisible();

    const aipDetailsPage = new AipDetailsPage(page);
    await aipDetailsPage.openDocumentDetailFromTree();

    await expect(aipDetailsPage.documentDetailTitle).toBeVisible();
    await expect(aipDetailsPage.aipHeading).toBeVisible();
    await expect(aipDetailsPage.aipUuidRow).toContainText('AIP-UUID-301');
  }

  test(`[TS-184] Verificare che se la stampa non è disponibile, l'utente possa visualizzare un messaggio di stampa non avvenuta`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-187] Verificare che l'utente possa avviare la verifica della classe documentale`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-188] Verificare che l'utente possa visualizzare lo stato di verifica della classe documentale`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-189] Verificare che l'utente possa avviare la verifica dell'integrità processo`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-190] Verificare che l'utente possa visualizzare lo stato di verifica dell'integrità processo`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-192] Verificare che l'utente possa visualizzare lo stato di verifica del documento`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-194] Verificare che l'utente possa visualizzare il conteggio totale delle classi documentali verificate nel report del DIP`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-195] Verificare che l'utente possa visualizzare il numero di classi integre (stato "Valido") in colore verde nel report del DIP`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-196] Verificare che l'utente possa visualizzare il numero di classi corrotte (stato "Non Valido") in colore rosso nel report del DIP`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-197] Verificare che l'utente possa visualizzare l'elenco delle classi corrotte indicando nome e numero di processi corrotti per ciascuna`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-198] Verificare che l'utente possa visualizzare la classe corrotta indicando nome e numero di processi corrotti`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-199] Verificare che l'utente possa visualizzare la data e l'ora di inizio della verifica del DIP nel formato "GG/MM/AAAA HH:MM:SS"`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-200] Verificare che l'utente sia informato con un messaggio nel caso in cui non vi siano classi corrotte`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-201] Verificare che l'utente possa visualizzare il report di integrità dettagliato per una singola classe documentale`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-202] Verificare che l'utente possa visualizzare il conteggio dei processi verificati all'interno della classe documentale`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-203] Verificare che l'utente possa visualizzare il numero di processi integri (stato "Valido") in colore verde nella classe documentale`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-204] Verificare che l'utente possa visualizzare il numero di processi corrotti (stato "Non Valido") in colore rosso nella classe documentale`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-205] Verificare che l'utente possa visualizzare la lista dei processi corrotti con il relativo numero di documenti compromessi`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-206] Verificare che l'utente possa visualizzare il singolo processo corrotto con il relativo numero di documenti compromessi`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-207] Verificare che l'utente possa visualizzare la data e l'ora di inizio della verifica della classe nel formato "GG/MM/AAAA HH:MM:SS"`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-208] Verificare che l'utente sia informato che tutti i processi sono integri`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-209] Verificare che l'utente possa visualizzare il report di integrità dettagliato di un singolo processo`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-210] Verificare che l'utente possa visualizzare il conteggio dei documenti verificati all'interno del processo selezionato`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-211] Verificare che l'utente possa visualizzare il numero di documenti integri (stato "Valido") in colore verde nel processo selezionato`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-212] Verificare che l'utente possa visualizzare il numero di documenti corrotti (stato "Non Valido") in colore rosso nel processo selezionato`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-213] Verificare che l'utente possa visualizzare la lista dei documenti corrotti`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-214] Verificare che l'utente possa visualizzare i singoli documenti corrotti della lista dei documenti corrotti, con i dettagli dell'errore`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-215] Verificare che l'utente possa visualizzare la data e l'ora di inizio della verifica del processo nel formato "GG/MM/AAAA HH:MM:SS"`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-216] Verificare che l'utente sia avvisato che tutti i documenti sono integri tramite un messaggio`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-220] Verificare che l'utente possa visualizzare la data e l'ora di inizio della verifica del documento nel formato "GG/MM/AAAA HH:MM:SS"`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-221] Verificare che l'utente possa visualizzare la descrizione tecnica del dettaglio dell'errore per i documenti con stato "Non Valido"`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-223] Verificare che l'utente sia informato con un messaggio di errore qualora la generazione del file PDF non vada a buon fine`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-224] Verificare che l'utente possa scaricare un file in una cartella locale previa selezione della cartella di destinazione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-225] Verificare che l'utente sia informato con un messaggio di conferma indicando il percorso di destinazione al termine del salvataggio`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-226] Verificare che il sistema impedisca il salvataggio di file all'interno della cartella sorgente del DIP per preservarne l'integrità`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-227] Verificare che l'utente sia informato con un errore specifico se l'utente tenta di scaricare un file nel percorso protetto del DIP`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-233] Verificare che l'utente possa visualizzare la data di fine di un processo o sessione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-234] Verificare che se il processo o la sessione non è ancora terminato/a, al posto della data di fine l'utente sia informato con un messaggio che indica l'assenza della data di fine`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-235] Verificare che l'utente possa visualizzare lo UUID dell'utente attivatore di un processo o sessione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-236] Verificare che l'utente possa visualizzare lo UUID dell'utente terminatore di un processo o sessione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-237] Verificare che se il processo o la sessione non è ancora terminato/a, al posto dello UUID dell'utente terminatore l'utente sia informato con un messaggio che indica l'assenza dello UUID`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-238] Verificare che l'utente possa visualizzare il nome del canale di attivazione di un processo o sessione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-239] Verificare che l'utente possa visualizzare il nome del canale di terminazione di un processo o sessione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-240] Verificare che se il processo o la sessione non è ancora terminato/a, al posto del nome del canale di terminazione l'utente sia informato con un messaggio che indica l'assenza del nome del canale di terminazione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });

  test(`[TS-241] Verificare che l'utente possa visualizzare lo stato di un processo o sessione`, async ({ page }) => {
    await assertBaselineIntegrityAndDetail(page);
  });
});
