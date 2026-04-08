import { expect, Page, test } from '@playwright/test';
import { AdministrativeProceduresPage } from './administrative-procedures.page';
import { AttachmentsPage } from './attachments.page';
import { TechnicalMetadataPage } from './technical-metadata.page';

type MockRequest = { channel: string; payload: unknown };
type MetadataNode = { name: string; value: unknown };

type AttachmentMock = {
  id: string;
  descrizione: string;
};

type PhaseMock = {
  tipoFase: string;
  dataInizio: string;
  dataFine?: string;
};

type DocumentMockOptions = {
  metadataOverrides?: Record<string, unknown>;
  attachments?: AttachmentMock[];
  includeCustomMetadata?: boolean;
  customMetadata?: Record<string, string>;
};

type AggregateMockOptions = {
  metadataOverrides?: Record<string, unknown>;
  phases?: PhaseMock[];
  documents?: Array<{ id: number; nome: string }>;
};

function createDocumentMetadataNodes(options: DocumentMockOptions = {}): MetadataNode[] {
  const baseScalarValues: Record<string, unknown> = {
    NomeDelDocumento: 'Determina-2026.pdf',
    Oggetto: 'Affidamento servizio manutenzione annuale',
    Note: 'Documento con note operative complete.',
    TipologiaDocumentale: 'Determina',
    ModalitaDiFormazione: 'NativaDigitale',
    Riservato: 'riservato',
    VersioneDelDocumento: '3.2',
    TipologiaDiFlusso: 'Entrata',
    TipoRegistro: 'Protocollo Generale',
    DataRegistrazioneDocumento: '2026-04-08 11:00:00',
    DataProtocollazioneDocumento: '2026-04-08 11:05:00',
    NumeroRegistrazioneDocumento: 'REG-2026-0045',
    NumeroProtocolloDocumento: 'PROT-2026-0998',
    CodiceRegistro: 'REG-COD-01',
    Formato: 'application/pdf',
    NomeProdotto: 'DocSuite',
    Versione: '5.4.1',
    Produttore: 'ACME Software',
    Algoritmo: 'SHA-256',
    Impronta: 'A3F5D8E2C1B0',
    FirmatoDigitalmente: 'SI',
    SigillatoElettronicamente: 'SI',
    MarcaturaTemporale: 'SI',
    ConformitaCopieImmagineSuSupportoInformatico: 'CONFORME',
    TipoModifica: 'Rettifica',
    Soggetto: 'Mario Rossi',
    DataModifica: '2026-04-08 12:30:00',
    IdentificativoVersionePrecedente: 'DOC-VER-0001',
    IndiceDiClassificazione: 'A.12.04',
    Descrizione: 'Classificazione Atti Dirigenziali',
    PianoDiClassificazione: 'https://piano.example.gov/class/A.12.04',
  };

  const mergedScalarValues = options.metadataOverrides
    ? { ...baseScalarValues, ...options.metadataOverrides }
    : baseScalarValues;
  const nodes: MetadataNode[] = Object.entries(mergedScalarValues).map(([name, value]) => ({
    name,
    value,
  }));

  const attachments =
    options.attachments ??
    [
      { id: 'ALL-001', descrizione: 'Allegato tecnico principale' },
      { id: 'ALL-002', descrizione: 'Allegato economico' },
    ];

  nodes.push({ name: 'NumeroAllegati', value: attachments.length });

  for (const attachment of attachments) {
    nodes.push({
      name: 'IndiceAllegati',
      value: [
        { name: 'Identificativo', value: attachment.id },
        { name: 'Descrizione', value: attachment.descrizione },
      ],
    });
  }

  const includeCustomMetadata = options.includeCustomMetadata ?? true;
  if (includeCustomMetadata) {
    const customMetadataBase = {
      'MetaCustom.CodiceInterno': 'INT-2026-77',
      'MetaCustom.UfficioResponsabile': 'Ufficio Contratti',
    };
    const customMetadata = options.customMetadata
      ? { ...customMetadataBase, ...options.customMetadata }
      : customMetadataBase;

    for (const [name, value] of Object.entries(customMetadata)) {
      nodes.push({ name, value });
    }
  }

  return nodes;
}

function createAggregateMetadataNodes(options: AggregateMockOptions = {}): MetadataNode[] {
  const baseValues: Record<string, unknown> = {
    TipoAggregazione: 'Fascicolo',
    IdAggregazione: 'AGG-2026-001',
    IdAggPrimario: 'AGG-PRIM-900',
    TipologiaFascicolo: 'procedimento amministrativo',
    TipoAssegnazione: 'Per competenza',
    Nome: 'Ufficio Gare e Contratti',
    DataInizioAssegnazione: '2026-04-01 09:00:00',
    DataFineAssegnazione: '2026-04-30 18:00:00',
    DataApertura: '2026-04-01',
    DataChiusura: '2026-04-30',
    Progressivo: '17',
    IndiceDiClassificazione: 'PROC.2026.17',
    Descrizione: 'Fascicolo procedura aperta manutenzione',
    Oggetto: 'Procedura manutenzione impianti comunali',
    MateriaArgomentoStruttura: 'LavoriPubblici/ImpiantiTecnologici',
    Procedimento: 'Affidamento servizio manutenzione',
    URIProcedimento: 'https://procedimenti.example.gov/affidamento-manutenzione',
    PosizioneFisicaAggregazioneDocumentale: 'Archivio Centrale - Scaffale B/12',
    TempoDiConservazione: '10',
  };

  const mergedValues = options.metadataOverrides
    ? { ...baseValues, ...options.metadataOverrides }
    : baseValues;
  const nodes: MetadataNode[] = Object.entries(mergedValues).map(([name, value]) => ({
    name,
    value,
  }));

  const phases =
    options.phases ??
    [
      {
        tipoFase: 'Istruttoria',
        dataInizio: '2026-04-03 10:00:00',
        dataFine: '2026-04-10 16:00:00',
      },
      {
        tipoFase: 'Decisoria o liberativa',
        dataInizio: '2026-04-11 09:30:00',
        dataFine: '2026-04-20 12:00:00',
      },
    ];

  for (const phase of phases) {
    nodes.push({
      name: 'Fase',
      value: [
        { name: 'TipoFase', value: phase.tipoFase },
        { name: 'DataInizio', value: phase.dataInizio },
        { name: 'DataFine', value: phase.dataFine ?? '' },
      ],
    });
  }

  return nodes;
}

function createDefaultIpcMap(options: {
  document?: DocumentMockOptions;
  aggregate?: AggregateMockOptions;
}): Record<string, unknown> {
  const documents =
    options.aggregate?.documents ??
    [
      { id: 301, nome: 'Determina-2026.pdf' },
      { id: 302, nome: 'Capitolato-Tecnico.pdf' },
    ];

  return {
    'browse:get-document-by-id': {
      id: 301,
      uuid: 'DOC-UUID-301',
      integrityStatus: 'VALID',
      metadata: createDocumentMetadataNodes(options.document),
    },
    'browse:get-file-by-document': [{ id: 901, documentId: 301, isMain: true, filename: 'Determina-2026.pdf' }],
    'browse:get-file-buffer-by-id': [37, 80, 68, 70, 45],
    'browse:get-process-by-id': {
      id: 501,
      uuid: 'PROC-UUID-501',
      integrityStatus: 'VALID',
      metadata: createAggregateMetadataNodes(options.aggregate),
    },
    'browse:get-documents-by-process': documents.map((document) => ({
      id: document.id,
      uuid: `DOC-UUID-${document.id}`,
      metadata: [{ name: 'NomeDelDocumento', value: document.nome }],
    })),
  };
}

async function installMockIpc(
  page: Page,
  options: {
    document?: DocumentMockOptions;
    aggregate?: AggregateMockOptions;
  } = {},
): Promise<void> {
  const map = createDefaultIpcMap(options);

  await page.route('**/__e2e__/mock-ipc', async (route) => {
    const body = route.request().postDataJSON() as MockRequest;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(map[body.channel] ?? []),
    });
  });
}

async function openDocumentDetailWithMocks(page: Page, options: DocumentMockOptions = {}) {
  await installMockIpc(page, { document: options });

  const technicalMetadataPage = new TechnicalMetadataPage(page);
  const attachmentsPage = new AttachmentsPage(page);

  await technicalMetadataPage.openDocumentDetail('301');

  return { technicalMetadataPage, attachmentsPage };
}

async function openAggregateDetailWithMocks(page: Page, options: AggregateMockOptions = {}) {
  await installMockIpc(page, { aggregate: options });

  const administrativeProceduresPage = new AdministrativeProceduresPage(page);
  await administrativeProceduresPage.openAggregateDetail('501');

  return { administrativeProceduresPage };
}

test.describe('Dettagli Tecnici e Procedimenti Finali - Mocked', () => {
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
            throw new Error('Mock IPC error');
          }

          return response.json();
        },
      };
    });
  });

  test('[TS-241] Visualizzare la tipologia di flusso del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.registrationFlusso).toContainText('Entrata');
  });

  test('[TS-242] Visualizzare il tipo di registro del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.registrationTipoRegistro).toContainText('Protocollo Generale');
  });

  test('[TS-243] Visualizzare la data di registrazione del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.registrationProtocollo).toContainText('2026-04-08 11:00:00');
  });

  test('[TS-244] Visualizzare la data di registrazione del documento non protocollato selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        DataProtocollazioneDocumento: '',
        DataRegistrazioneDocumento: '2026-04-09 08:15:00',
      },
    });
    await expect(technicalMetadataPage.registrationProtocollo).toContainText('2026-04-09 08:15:00');
  });

  test('[TS-245] Visualizzare la data di protocollazione del documento protocollato selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        DataRegistrazioneDocumento: '',
        DataProtocollazioneDocumento: '2026-04-10 09:45:00',
      },
    });
    await expect(technicalMetadataPage.registrationProtocollo).toContainText('2026-04-10 09:45:00');
  });

  test('[TS-246] Visualizzare il numero del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.registrationProtocollo).toContainText('REG-2026-0045');
  });

  test('[TS-247] Visualizzare il numero di registrazione del documento non protocollato selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        NumeroProtocolloDocumento: '',
        NumeroRegistrazioneDocumento: 'REG-ONLY-33',
      },
    });
    await expect(technicalMetadataPage.registrationProtocollo).toContainText('REG-ONLY-33');
  });

  test('[TS-248] Visualizzare il numero di protocollo del documento protocollato selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        NumeroRegistrazioneDocumento: '',
        NumeroProtocolloDocumento: 'PROT-ONLY-77',
      },
    });
    await expect(technicalMetadataPage.registrationProtocollo).toContainText('PROT-ONLY-77');
  });

  test('[TS-249] Visualizzare il codice identificativo del registro di appartenenza del documento', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.registrationCodice).toContainText('REG-COD-01');
  });

  test('[TS-250] Visualizzare la tipologia documentale del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.documentTipo).toContainText('Determina');
  });

  test('[TS-251] Visualizzare la modalità di formazione del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.documentFormazione).toContainText('NativaDigitale');
  });

  test('[TS-252] Visualizzare lo stato di riservatezza del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.documentRiservatezza).toContainText('riservato');
  });

  test('[TS-253] Visualizzare il tipo di formato del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.formatTipo).toContainText('application/pdf');
  });

  test('[TS-254] Visualizzare il nome del prodotto software che ha generato il documento', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.formatProdotto).toContainText('DocSuite');
  });

  test('[TS-255] Visualizzare la versione del prodotto software che ha generato il documento', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.formatProdotto).toContainText('5.4.1');
  });

  test('[TS-256] Visualizzare il produttore del software che ha generato il documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.formatProduttore).toContainText('ACME Software');
  });

  test('[TS-257] Visualizzare le informazioni di verifica del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.verificationHeading).toBeVisible();
    await expect(technicalMetadataPage.verificationFirma).toBeVisible();
    await expect(technicalMetadataPage.verificationSigillo).toBeVisible();
    await expect(technicalMetadataPage.verificationMarcatura).toBeVisible();
  });

  test('[TS-258] Verificare se il documento selezionato è firmato digitalmente', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.verificationFirma).toContainText('SI');
  });

  test('[TS-259] Verificare se il documento selezionato è sigillato elettronicamente', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.verificationSigillo).toContainText('SI');
  });

  test('[TS-260] Verificare se il documento selezionato è dotato di marcatura temporale', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.verificationMarcatura).toContainText('SI');
  });

  test('[TS-261] Visualizzare se vi è conformità alle copie immagine su supporto informatico', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.verificationConformitaCopie).toContainText('CONFORME');
  });

  test('[TS-262] Visualizzare la versione del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.documentVersione).toContainText('3.2');
  });

  test('[TS-263] Visualizzare il nome del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.documentNome).toContainText('Determina-2026.pdf');
  });

  test('[TS-264] Visualizzare le informazioni degli allegati del documento selezionato', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page);
    await expect(attachmentsPage.heading).toBeVisible();
    await expect(attachmentsPage.list).toBeVisible();
  });

  test('[TS-265] Visualizzare il numero di allegati del documento selezionato', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page);
    await expect(attachmentsPage.numeroRow).toContainText('2');
  });

  test('[TS-266] Visualizzare il singolo allegato', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page);
    await expect(attachmentsPage.item(0)).toBeVisible();
  });

  test('[TS-267] Visualizzare l identificativo di ciascun allegato se presente', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page);
    await expect(attachmentsPage.itemId(0)).toContainText('ALL-001');
  });

  test('[TS-268] Messaggio di errore se l identificativo dell allegato non è disponibile', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page, {
      attachments: [{ id: '', descrizione: 'Allegato senza identificativo' }],
    });
    await expect(attachmentsPage.itemId(0)).toContainText('Identificativo allegato non disponibile');
  });

  test('[TS-269] Visualizzare la descrizione di ciascun allegato se presente', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page);
    await expect(attachmentsPage.itemDescription(0)).toContainText('Allegato tecnico principale');
  });

  test('[TS-270] Messaggio di errore se la descrizione dell allegato non è disponibile', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page, {
      attachments: [{ id: 'ALL-ERR-01', descrizione: '' }],
    });
    await expect(attachmentsPage.itemDescription(0)).toContainText('Descrizione allegato non disponibile');
  });

  test('[TS-271] Messaggio di informativa che indica l assenza degli allegati', async ({ page }) => {
    const { attachmentsPage } = await openDocumentDetailWithMocks(page, {
      attachments: [],
    });
    await expect(attachmentsPage.emptyMessage).toContainText('Nessun dettaglio allegato presente');
  });

  test('[TS-272] Visualizzare tutte le informazioni sulle modifiche di un documento', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.changeTrackingHeading).toBeVisible();
    await expect(technicalMetadataPage.changeTipo).toBeVisible();
    await expect(technicalMetadataPage.changeSoggetto).toBeVisible();
    await expect(technicalMetadataPage.changeData).toBeVisible();
    await expect(technicalMetadataPage.changeIdVersionePrecedente).toBeVisible();
  });

  test('[TS-273] Visualizzare il tipo di modifica (Annullamento, Rettifica, Integrazione, Annotazione)', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: { TipoModifica: 'Annotazione' },
    });
    await expect(technicalMetadataPage.changeTipo).toContainText('Annotazione');
  });

  test('[TS-274] Visualizzare le informazioni del soggetto autore di ogni modifica', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.changeSoggetto).toContainText('Mario Rossi');
  });

  test('[TS-275] Visualizzare la data e l ora di ogni modifica del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.changeData).toContainText('2026-04-08 12:30:00');
  });

  test('[TS-276] Visualizzare l identificativo del documento alla versione precedente alla modifica', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.changeIdVersionePrecedente).toContainText('DOC-VER-0001');
  });

  test('[TS-277] Visualizzare il tipo di aggregazione (Fascicolo, Serie Documentale, Serie di Fascicoli)', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.tipoAggregazione).toContainText('Fascicolo');
  });

  test('[TS-278] Visualizzare l identificativo dell aggregazione documentale selezionata', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.idAggregazione).toContainText('AGG-2026-001');
  });

  test('[TS-279] Visualizzare la tipologia di fascicolo (Affare, Attività, Persona, Procedimento)', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.tipologiaFascicolo).toContainText('procedimento amministrativo');
  });

  test('[TS-280] Visualizzare il tipo di assegnazione (Per competenza, Per conoscenza)', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.tipoAssegnazione).toContainText('Per competenza');
  });

  test('[TS-281] Visualizzare le informazioni del soggetto assegnatario dell aggregazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.soggettoAssegnatario).toContainText('Ufficio Gare e Contratti');
  });

  test('[TS-282] Visualizzare la data e l ora di inizio dell assegnazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.dataInizioAssegnazione).toContainText('2026-04-01 09:00:00');
  });

  test('[TS-283] Visualizzare la data e l ora di fine dell assegnazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.dataFineAssegnazione).toContainText('2026-04-30 18:00:00');
  });

  test('[TS-284] Visualizzare la data di apertura dell aggregazione documentale selezionata', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.dataApertura).toContainText('2026');
  });

  test('[TS-285] Visualizzare la data di chiusura dell aggregazione documentale selezionata', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.dataChiusura).toContainText('2026');
  });

  test('[TS-286] Visualizzare il progressivo dell aggregazione documentale selezionata', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.progressivo).toContainText('17');
  });

  test('[TS-287] Visualizzare le informazioni del procedimento amministrativo dell aggregazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.adminProcedureHeading).toBeVisible();
    await expect(administrativeProceduresPage.procedimentoDenominazione).toBeVisible();
    await expect(administrativeProceduresPage.procedimentoIndiceUri).toBeVisible();
  });

  test('[TS-288] Visualizzare l indice della materia/argomento/struttura di catalogazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.procedimentoIndiceUri).toContainText('LavoriPubblici/ImpiantiTecnologici');
  });

  test('[TS-289] Visualizzare la denominazione del procedimento amministrativo', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.procedimentoDenominazione).toContainText('Affidamento servizio manutenzione');
  });

  test('[TS-290] Visualizzare il catalogo dei procedimenti come URI di pubblicazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.procedimentoIndiceUri).toContainText('https://procedimenti.example.gov/affidamento-manutenzione');
  });

  test('[TS-291] Visualizzare la lista delle fasi del procedimento amministrativo', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.phase(0)).toBeVisible();
    await expect(administrativeProceduresPage.phase(1)).toBeVisible();
  });

  test('[TS-292] Visualizzare le singole fasi della lista complete di dati della fase', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.phaseType(0)).toContainText('Istruttoria');
    await expect(administrativeProceduresPage.phaseDates(0)).toContainText('2026-04-03 10:00:00');
    await expect(administrativeProceduresPage.phaseDates(0)).toContainText('2026-04-10 16:00:00');
  });

  test('[TS-293] Visualizzare il tipo di fase (Preparatoria, Istruttoria, Consultiva, Decisoria, ecc.)', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.phaseType(0)).toContainText('Istruttoria');
  });

  test('[TS-294] Visualizzare la data e l ora di inizio della fase', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.phaseDates(0)).toContainText('2026-04-03 10:00:00');
  });

  test('[TS-295] Visualizzare la data e l ora di fine della fase', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.phaseDates(0)).toContainText('2026-04-10 16:00:00');
  });

  test('[TS-296] Visualizzare l indice dei documenti contenuti nell aggregazione documentale', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.documentIndexHeading).toBeVisible();
  });

  test('[TS-297] Visualizzare ogni voce dell indice dei documenti dell aggregazione', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.documentIndexRow(0)).toBeVisible();
    await expect(administrativeProceduresPage.documentIndexRow(1)).toBeVisible();
  });

  test('[TS-298] Visualizzare per ogni voce dell indice il tipo di documento contenuto', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.documentIndexType(0)).toContainText('Documento');
  });

  test('[TS-299] Visualizzare per ogni voce dell indice l identificativo del documento', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.documentIndexIdentifier(0)).toContainText('Determina-2026.pdf');
  });

  test('[TS-300] Visualizzare la posizione fisica dell aggregazione documentale selezionata', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.posizioneFisica).toContainText('Archivio Centrale - Scaffale B/12');
  });

  test('[TS-301] Visualizzare l identificativo dell aggregazione primaria', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.idAggregazionePrimaria).toContainText('AGG-PRIM-900');
  });

  test('[TS-302] Visualizzare il tempo di conservazione dell aggregazione documentale', async ({ page }) => {
    const { administrativeProceduresPage } = await openAggregateDetailWithMocks(page);
    await expect(administrativeProceduresPage.tempoConservazione).toContainText('10 anni');
  });

  test('[TS-303] Visualizzare le informazioni di ciascun metadato custom del documento', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.customMetadataHeading).toBeVisible();
    await expect(technicalMetadataPage.customMetadataRow('MetaCustom.CodiceInterno')).toBeVisible();
    await expect(technicalMetadataPage.customMetadataRow('MetaCustom.UfficioResponsabile')).toBeVisible();
  });

  test('[TS-304] Visualizzare il nome di ciascun metadato custom del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.customMetadataRow('MetaCustom.CodiceInterno')).toContainText('MetaCustom.CodiceInterno');
  });

  test('[TS-305] Visualizzare il valore di ciascun metadato custom del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.customMetadataValue('MetaCustom.CodiceInterno')).toContainText('INT-2026-77');
  });

  test('[TS-306] Messaggio di informativa che indica l assenza di metadati custom', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page, {
      includeCustomMetadata: false,
    });
    await expect(technicalMetadataPage.customMetadataEmpty).toContainText('Nessuna metadato personalizzato presente');
  });

  test('[TS-307] Visualizzare i dati di registrazione del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.registrationHeading).toBeVisible();
    await expect(technicalMetadataPage.registrationTipoRegistro).toBeVisible();
    await expect(technicalMetadataPage.registrationFlusso).toBeVisible();
    await expect(technicalMetadataPage.registrationProtocollo).toBeVisible();
  });

  test('[TS-308] Visualizzare informazioni di classificazione del documento selezionato', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.classificationHeading).toBeVisible();
    await expect(technicalMetadataPage.classificationIndice).toContainText('A.12.04');
    await expect(technicalMetadataPage.classificationDescrizione).toContainText('Classificazione Atti Dirigenziali');
  });

  test('[TS-309] Visualizzare informazioni sul formato e sul prodotto software di generazione', async ({ page }) => {
    const { technicalMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(technicalMetadataPage.formatHeading).toBeVisible();
    await expect(technicalMetadataPage.formatTipo).toContainText('application/pdf');
    await expect(technicalMetadataPage.formatSoftwareInfoRow).toContainText('DocSuite 5.4.1');
  });
});
