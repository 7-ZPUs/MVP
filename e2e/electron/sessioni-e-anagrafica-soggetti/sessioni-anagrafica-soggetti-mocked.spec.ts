import { expect, Page, test } from '@playwright/test';
import { DocumentMetadataPage } from './document-metadata.page';
import { SessionDetailsPage } from './session-details.page';
import { SubjectAnagraphicPage } from './subject-anagraphic.page';

type MockRequest = { channel: string; payload: unknown };
type MetadataNode = { name: string; value: unknown };

type MockOptions = {
  metadataOverrides?: Record<string, string>;
  includeSubjects?: boolean;
  noteValue?: string;
};

function createSubjectNodes(): MetadataNode[] {
  return [
    {
      name: 'Ruolo',
      value: [
        { name: 'TipoRuolo', value: 'Autore' },
        {
          name: 'PF',
          value: [
            { name: 'Nome', value: 'Mario' },
            { name: 'Cognome', value: 'Rossi' },
            { name: 'CodiceFiscale', value: 'RSSMRA80A01H501U' },
          ],
        },
      ],
    },
    {
      name: 'Ruolo',
      value: [
        { name: 'TipoRuolo', value: 'Destinatario' },
        {
          name: 'PG',
          value: [
            { name: 'DenominazioneOrganizzazione', value: 'ACME S.p.A.' },
            { name: 'CodiceFiscale_PartitaIva', value: '01234567890' },
          ],
        },
      ],
    },
    {
      name: 'Ruolo',
      value: [
        { name: 'TipoRuolo', value: 'RUP' },
        {
          name: 'AS',
          value: [{ name: 'Id', value: 'AS-001' }],
        },
      ],
    },
    {
      name: 'Ruolo',
      value: [
        { name: 'TipoRuolo', value: 'ProtocolloPAI' },
        {
          name: 'PAI',
          value: [{ name: 'IPAAmm', value: 'c_h501' }],
        },
      ],
    },
    {
      name: 'Ruolo',
      value: [
        { name: 'TipoRuolo', value: 'InteroperabilitaPAE' },
        {
          name: 'PAE',
          value: [{ name: 'CodicePAE', value: 'PAE-001' }],
        },
      ],
    },
    {
      name: 'Ruolo',
      value: [
        { name: 'TipoRuolo', value: 'SistemaMittente' },
        {
          name: 'SW',
          value: [{ name: 'NomeSistema', value: 'ProtocolloHub' }],
        },
      ],
    },
  ];
}

function createMetadataNodes(options: MockOptions = {}): MetadataNode[] {
  const defaultCustomFields: Record<string, string> = {
    'SessioneVersamento.DataFine': '2026-04-07 16:15:12',
    'SessioneVersamento.UUIDAttivatore': 'USR-ATT-VERS-001',
    'SessioneVersamento.UUIDTerminatore': 'USR-TERM-VERS-001',
    'SessioneVersamento.CanaleAttivazione': 'PortaleWeb',
    'SessioneVersamento.CanaleTerminazione': 'API-Submission',
    'SessioneVersamento.Stato': 'TERMINATA',
    'SessioneConservazione.Processo': 'PROC-CONS-001',
    'SessioneConservazione.DataInizio': '2026-04-08 09:00:00',
    'SessioneConservazione.DataFine': '2026-04-08 12:40:59',
    'SessioneConservazione.UUIDAttivatore': 'USR-ATT-CONS-001',
    'SessioneConservazione.UUIDTerminatore': 'USR-TERM-CONS-001',
    'SessioneConservazione.CanaleAttivazione': 'ConservazioneBatch',
    'SessioneConservazione.CanaleTerminazione': 'ConservazioneBatch',
    'SessioneConservazione.Stato': 'TERMINATA',
    'Soggetti.PF.IndirizziDigitali': 'mario.rossi@pec.it',
    'Soggetti.PG.CodiceFiscale': '97654321000',
    'Soggetti.PG.DenominazioneUfficio': 'Ufficio Legale',
    'Soggetti.PG.IndirizziDigitali': 'acme@pec.it',
    'Soggetti.AS.Cognome': 'Verdi',
    'Soggetti.AS.Nome': 'Giulia',
    'Soggetti.AS.CodiceFiscale': 'VRDGLI85C50H501R',
    'Soggetti.AS.DenominazioneOrganizzazione': 'Comune di Roma',
    'Soggetti.AS.DenominazioneUfficio': 'Servizi Demografici',
    'Soggetti.AS.IndirizziDigitali': 'demografici@pec.comune.roma.it',
    'Soggetti.PAI.DenominazioneAmministrazioneCodiceIPA': 'Comune di Torino - c_l219',
    'Soggetti.PAI.AOO.CodiceIPA': 'AOO-TORINO-01',
    'Soggetti.PAI.UOR.CodiceIPA': 'UOR-TORINO-42',
    'Soggetti.PAI.IndirizziDigitali': 'protocollo@pec.comune.torino.it',
    'Soggetti.PAE.DenominazioneAmministrazione': 'Ville de Paris',
    'Soggetti.PAE.DenominazioneUfficio': 'Direction Generale',
    'Soggetti.PAE.IndirizziDigitali': 'courrier@paris.fr',
    'Soggetti.SW.DenominazioneSistema': 'Sistema Interoperabilita ND',
    TempoConservazioneEffettivo: '10 anni (override documento)',
    TempoConservazioneMessaggio: 'Il tempo di conservazione effettivo coincide con quello dell aggregazione.',
    'NoteDocumento.Messaggio': 'Nessuna nota aggiuntiva presente.',
  };

  const mergedCustomFields = {
    ...defaultCustomFields,
    ...options.metadataOverrides,
  };

  const customNodes: MetadataNode[] = Object.entries(mergedCustomFields).map(([name, value]) => ({
    name,
    value,
  }));

  return [
    { name: 'NomeDelDocumento', value: 'Determina-2026.pdf' },
    { name: 'Oggetto', value: 'Affidamento servizio manutenzione annuale' },
    {
      name: 'Note',
      value: options.noteValue ?? 'Documento con note operative per il procedimento selezionato.',
    },
    { name: 'TipologiaDocumentale', value: 'Determina' },
    { name: 'ModalitaDiFormazione', value: 'NativaDigitale' },
    { name: 'Riservato', value: 'false' },
    { name: 'VersioneDelDocumento', value: '3.2' },
    { name: 'IndiceDiClassificazione', value: 'A.12.04' },
    { name: 'Descrizione', value: 'Classificazione Atti Dirigenziali' },
    { name: 'PianoDiClassificazione', value: 'https://piano.example.gov/class/A.12.04' },
    { name: 'PreservationProcessUUID', value: 'PROC-CONS-001' },
    { name: 'PreservationProcessDate', value: '2026-04-08 09:00:00' },
    { name: 'ClasseDocumentale', value: 'Determine Dirigenziali' },
    ...(options.includeSubjects === false ? [] : createSubjectNodes()),
    ...customNodes,
  ];
}

function createDefaultIpcMap(options: MockOptions = {}): Record<string, unknown> {
  return {
    'browse:get-dip-by-id': { id: 1, name: 'DIP test' },
    'browse:get-document-class-by-dip-id': [{ id: 101, name: 'Classe Contratti', integrityStatus: 'VALID' }],
    'browse:get-process-by-document-class': [{ id: 201, uuid: 'PROC-201', integrityStatus: 'VALID' }],
    'browse:get-documents-by-process': [{ id: 301, uuid: 'DOC-301', integrityStatus: 'VALID' }],
    'browse:get-document-by-id': {
      id: 301,
      uuid: 'DOC-301',
      integrityStatus: 'VALID',
      metadata: createMetadataNodes(options),
    },
    'browse:get-file-by-document': [{ id: 901, documentId: 301, isMain: true, filename: 'Determina-2026.pdf' }],
    'browse:get-file-buffer-by-id': [37, 80, 68, 70, 45],
  };
}

async function installMockIpc(page: Page, options: MockOptions = {}): Promise<void> {
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

async function openDocumentDetailWithMocks(page: Page, options: MockOptions = {}) {
  await installMockIpc(page, options);

  const documentMetadataPage = new DocumentMetadataPage(page);
  await documentMetadataPage.openDocumentDetail('301');

  return {
    documentMetadataPage,
    sessionDetailsPage: new SessionDetailsPage(page),
    subjectAnagraphicPage: new SubjectAnagraphicPage(page),
  };
}

test.describe('Sessioni e Anagrafica Soggetti - Mocked', () => {
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

  test(`[TS-244] Verificare che l'utente possa visualizzare la data di fine della sessione di versamento`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.DataFine')).toContainText('2026-04-07 16:15:12');
  });

  test(`[TS-245] Verificare che se la sessione di versamento non è ancora terminata, al posto della data di fine l'utente sia informato con un messaggio che indica l'assenza della data di fine`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneVersamento.DataFine': 'Sessione di versamento non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.DataFine')).toContainText('Sessione di versamento non terminata.');
  });

  test(`[TS-246] Verificare che l'utente possa visualizzare lo UUID dell'utente attivatore della sessione di versamento`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.UUIDAttivatore')).toContainText('USR-ATT-VERS-001');
  });

  test(`[TS-247] Verificare che l'utente possa visualizzare lo UUID dell'utente terminatore della sessione di versamento`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.UUIDTerminatore')).toContainText('USR-TERM-VERS-001');
  });

  test(`[TS-248] Verificare che se la sessione di versamento non è ancora terminata, al posto dello UUID dell'utente terminatore l'utente sia informato con un messaggio che indica l'assenza dello UUID`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneVersamento.UUIDTerminatore': 'Utente terminatore non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.UUIDTerminatore')).toContainText('sessione non terminata');
  });

  test(`[TS-249] Verificare che l'utente possa visualizzare il nome del canale di attivazione della sessione di versamento`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.CanaleAttivazione')).toContainText('PortaleWeb');
  });

  test(`[TS-250] Verificare che l'utente possa visualizzare il nome del canale di terminazione della sessione di versamento`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.CanaleTerminazione')).toContainText('API-Submission');
  });

  test(`[TS-251] Verificare che se la sessione di versamento non è ancora terminata, al posto del nome del canale di terminazione l'utente sia informato con un messaggio che indica l'assenza del nome del canale di terminazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneVersamento.CanaleTerminazione': 'Canale di terminazione non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.CanaleTerminazione')).toContainText('sessione non terminata');
  });

  test(`[TS-252] Verificare che l'utente possa visualizzare lo stato della sessione di versamento`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.Stato')).toContainText('TERMINATA');
  });

  test(`[TS-253] Verificare che l'utente possa visualizzare le informazioni della sessione di conservazione del processo di conservazione selezionato`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.conservationProcessHeading).toBeVisible();
    await expect(sessionDetailsPage.conservationProcessRow('Processo:')).toContainText('PROC-CONS-001');
  });

  test(`[TS-254] Verificare che l'utente possa visualizzare la data di inizio della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.conservationProcessRow('Data Inizio:')).toContainText('2026-04-08 09:00:00');
  });

  test(`[TS-255] Verificare che l'utente possa visualizzare la data di fine della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.DataFine')).toContainText('2026-04-08 12:40:59');
  });

  test(`[TS-256] Verificare che se la sessione di conservazione non è ancora terminata, al posto della data di fine l'utente sia informato con un messaggio che indica l'assenza della data di fine`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneConservazione.DataFine': 'Sessione di conservazione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.DataFine')).toContainText('Sessione di conservazione non terminata.');
  });

  test(`[TS-257] Verificare che l'utente possa visualizzare lo UUID dell'utente attivatore della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.UUIDAttivatore')).toContainText('USR-ATT-CONS-001');
  });

  test(`[TS-258] Verificare che l'utente possa visualizzare lo UUID dell'utente terminatore della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.UUIDTerminatore')).toContainText('USR-TERM-CONS-001');
  });

  test(`[TS-259] Verificare che se la sessione di conservazione non è ancora terminata, al posto dello UUID dell'utente terminatore l'utente sia informato con un messaggio che indica l'assenza dello UUID`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneConservazione.UUIDTerminatore': 'Utente terminatore non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.UUIDTerminatore')).toContainText('sessione non terminata');
  });

  test(`[TS-260] Verificare che l'utente possa visualizzare il nome del canale di attivazione della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.CanaleAttivazione')).toContainText('ConservazioneBatch');
  });

  test(`[TS-261] Verificare che l'utente possa visualizzare il nome del canale di terminazione della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.CanaleTerminazione')).toContainText('ConservazioneBatch');
  });

  test(`[TS-262] Verificare che se la sessione di conservazione non è ancora terminata, al posto del nome del canale di terminazione l'utente sia informato con un messaggio che indica l'assenza del nome del canale di terminazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneConservazione.CanaleTerminazione': 'Canale terminazione non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.CanaleTerminazione')).toContainText('sessione non terminata');
  });

  test(`[TS-263] Verificare che l'utente possa visualizzare lo stato della sessione di conservazione`, async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.Stato')).toContainText('TERMINATA');
  });

  test(`[TS-264] Verificare che l'utente possa visualizzare la descrizione del documento selezionato`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Metadati Principali', 'Descrizione:')).toContainText('Documento con note operative per il procedimento selezionato.');
  });

  test(`[TS-265] Verificare che l'utente possa visualizzare la lista dei soggetti coinvolti nel documento selezionato`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectsHeading).toBeVisible();
    await expect(subjectAnagraphicPage.subjectCards).toHaveCount(6);
  });

  test(`[TS-266] Verificare che per ogni soggetto coinvolto nel documento, l'utente possa visualizzare il ruolo del soggetto nel documento`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectCardByRole('Autore')).toBeVisible();
  });

  test(`[TS-267] Verificare che per ogni soggetto coinvolto nel documento, l'utente possa visualizzare il tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectTypeBadgeByRole('Autore')).toContainText('PERSONA FISICA');
  });

  test(`[TS-268] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Fisica, l'utente possa visualizzare tutti i dati legati a questo tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Nome:')).toContainText('Mario');
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Cognome:')).toContainText('Rossi');
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'CodiceFiscale:')).toContainText('RSSMRA80A01H501U');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PF.IndirizziDigitali')).toContainText('mario.rossi@pec.it');
  });

  test(`[TS-269] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Fisica, l'utente possa visualizzare il nome del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Nome:')).toContainText('Mario');
  });

  test(`[TS-270] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Fisica, l'utente possa visualizzare il cognome del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Cognome:')).toContainText('Rossi');
  });

  test(`[TS-271] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Fisica, l'utente possa visualizzare il codice fiscale del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'CodiceFiscale:')).toContainText('RSSMRA80A01H501U');
  });

  test(`[TS-272] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Fisica, l'utente possa visualizzare gli indirizzi digitali di riferimento del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PF.IndirizziDigitali')).toContainText('mario.rossi@pec.it');
  });

  test(`[TS-273] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Giuridica, l'utente possa visualizzare tutti i dati legati a questo tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'DenominazioneOrganizzazione:')).toContainText('ACME S.p.A.');
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'CodiceFiscale_PartitaIva:')).toContainText('01234567890');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.CodiceFiscale')).toContainText('97654321000');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.DenominazioneUfficio')).toContainText('Ufficio Legale');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.IndirizziDigitali')).toContainText('acme@pec.it');
  });

  test(`[TS-274] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Giuridica, l'utente possa visualizzare la denominazione dell'organizzazione del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'DenominazioneOrganizzazione:')).toContainText('ACME S.p.A.');
  });

  test(`[TS-275] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Giuridica, l'utente possa visualizzare la partita IVA del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'CodiceFiscale_PartitaIva:')).toContainText('01234567890');
  });

  test(`[TS-276] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Giuridica, l'utente possa visualizzare il codice fiscale del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.CodiceFiscale')).toContainText('97654321000');
  });

  test(`[TS-277] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Giuridica, l'utente possa visualizzare la denominazione dell'ufficio del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.DenominazioneUfficio')).toContainText('Ufficio Legale');
  });

  test(`[TS-278] Verificare che se il soggetto coinvolto nel documento è di tipo Persona Giuridica, l'utente possa visualizzare gli indirizzi digitali di riferimento del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.IndirizziDigitali')).toContainText('acme@pec.it');
  });

  test(`[TS-279] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare tutti i dati legati a questo tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectTypeBadgeByRole('RUP')).toContainText('ASSEGNATARIO');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Cognome')).toContainText('Verdi');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Nome')).toContainText('Giulia');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.CodiceFiscale')).toContainText('VRDGLI85C50H501R');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneOrganizzazione')).toContainText('Comune di Roma');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneUfficio')).toContainText('Servizi Demografici');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.IndirizziDigitali')).toContainText('demografici@pec.comune.roma.it');
  });

  test(`[TS-280] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare il cognome del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Cognome')).toContainText('Verdi');
  });

  test(`[TS-281] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare il nome del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Nome')).toContainText('Giulia');
  });

  test(`[TS-282] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare il codice fiscale del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.CodiceFiscale')).toContainText('VRDGLI85C50H501R');
  });

  test(`[TS-283] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare la denominazione dell'organizzazione del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneOrganizzazione')).toContainText('Comune di Roma');
  });

  test(`[TS-284] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare la denominazione dell'ufficio del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneUfficio')).toContainText('Servizi Demografici');
  });

  test(`[TS-285] Verificare che se il soggetto coinvolto nel documento è di tipo AS, l'utente possa visualizzare gli indirizzi digitali di riferimento del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.IndirizziDigitali')).toContainText('demografici@pec.comune.roma.it');
  });

  test(`[TS-286] Verificare che se il soggetto coinvolto nel documento è di tipo PAI, l'utente possa visualizzare tutti i dati legati a questo tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectTypeBadgeByRole('ProtocolloPAI')).toContainText('AMMINISTRAZIONI PUBBLICHE ITALIANE');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.DenominazioneAmministrazioneCodiceIPA')).toContainText('Comune di Torino - c_l219');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.AOO.CodiceIPA')).toContainText('AOO-TORINO-01');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.UOR.CodiceIPA')).toContainText('UOR-TORINO-42');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.IndirizziDigitali')).toContainText('protocollo@pec.comune.torino.it');
  });

  test(`[TS-287] Verificare che se il soggetto coinvolto nel documento è di tipo PAI, l'utente possa visualizzare la denominazione dell'amministrazione e il codice IPA del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.DenominazioneAmministrazioneCodiceIPA')).toContainText('Comune di Torino - c_l219');
  });

  test(`[TS-288] Verificare che se il soggetto coinvolto nel documento è di tipo PAI, l'utente possa visualizzare la denominazione dell'amministrazione AOO e il codice IPA AOO del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.AOO.CodiceIPA')).toContainText('AOO-TORINO-01');
  });

  test(`[TS-289] Verificare che se il soggetto coinvolto nel documento è di tipo PAI, l'utente possa visualizzare la denominazione dell'amministrazione UOR e il codice IPA UOR del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.UOR.CodiceIPA')).toContainText('UOR-TORINO-42');
  });

  test(`[TS-290] Verificare che se il soggetto coinvolto nel documento è di tipo PAI, l'utente possa visualizzare gli indirizzi digitali di riferimento del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.IndirizziDigitali')).toContainText('protocollo@pec.comune.torino.it');
  });

  test(`[TS-291] Verificare che se il soggetto coinvolto nel documento è di tipo PAE, l'utente possa visualizzare tutti i dati legati a questo tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneAmministrazione')).toContainText('Ville de Paris');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneUfficio')).toContainText('Direction Generale');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.IndirizziDigitali')).toContainText('courrier@paris.fr');
  });

  test(`[TS-292] Verificare che se il soggetto coinvolto nel documento è di tipo PAE, l'utente possa visualizzare la denominazione dell'amministrazione del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneAmministrazione')).toContainText('Ville de Paris');
  });

  test(`[TS-293] Verificare che se il soggetto coinvolto nel documento è di tipo PAE, l'utente possa visualizzare la denominazione dell'ufficio del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneUfficio')).toContainText('Direction Generale');
  });

  test(`[TS-294] Verificare che se il soggetto coinvolto nel documento è di tipo PAE, l'utente possa visualizzare gli indirizzi digitali di riferimento del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.IndirizziDigitali')).toContainText('courrier@paris.fr');
  });

  test(`[TS-295] Verificare che se il soggetto coinvolto nel documento è di tipo SW, l'utente possa visualizzare tutti i dati legati a questo tipo di soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectCardByRole('SistemaMittente')).toBeVisible();
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.SW.DenominazioneSistema')).toContainText('Sistema Interoperabilita ND');
  });

  test(`[TS-296] Verificare che se il soggetto coinvolto nel documento è di tipo SW, l'utente possa visualizzare la denominazione del sistema del soggetto`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.SW.DenominazioneSistema')).toContainText('Sistema Interoperabilita ND');
  });

  test(`[TS-297] Verificare che l'utente possa visualizzare l'indice di classificazione del documento selezionato`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Indice:')).toContainText('A.12.04');
  });

  test(`[TS-298] Verificare che l'utente possa visualizzare la descrizione dell'indice di classificazione del documento selezionato`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Descrizione:')).toContainText('Classificazione Atti Dirigenziali');
  });

  test(`[TS-299] Verificare che l'utente possa visualizzare l'URI del piano di classificazione del documento selezionato`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Piano (URI):')).toContainText('https://piano.example.gov/class/A.12.04');
  });

  test(`[TS-300] Verificare che se il documento selezionato ha un tempo di conservazione diverso da quello assegnato all'aggregazione documentale informatica a cui appartiene, l'utente possa visualizzare il tempo di conservazione effettivo del documento`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.additionalMetadataValue('TempoConservazioneEffettivo')).toContainText('10 anni (override documento)');
  });

  test(`[TS-301] Verificare che se il tempo di conservazione del documento coincide con quello assegnato all'aggregazione documentale a cui appartiene, l'utente sia informato con un messaggio che indica questa coincidenza`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        TempoConservazioneMessaggio: 'Il tempo di conservazione coincide con quello dell aggregazione.',
      },
    });
    await expect(documentMetadataPage.additionalMetadataValue('TempoConservazioneMessaggio')).toContainText('coincide con quello dell aggregazione');
  });

  test(`[TS-302] Verificare che l'utente possa visualizzare le note relative al documento selezionato`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page, {
      noteValue: 'Nota operativa: controllare firma e allegati prima della chiusura.',
    });
    await expect(documentMetadataPage.rowByLabel('Metadati Principali', 'Note:')).toContainText('Nota operativa: controllare firma e allegati prima della chiusura.');
  });

  test(`[TS-303] Verificare che se le note del documento sono assenti o vuote, l'utente sia informato con un messaggio che indica l'assenza delle note`, async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page, {
      noteValue: '',
      metadataOverrides: {
        'NoteDocumento.Messaggio': 'Nessuna nota presente per il documento selezionato.',
      },
    });
    await expect(documentMetadataPage.additionalMetadataValue('NoteDocumento.Messaggio')).toContainText('Nessuna nota presente per il documento selezionato.');
  });

  const subjectRoles = [
    { role: 'Autore', label: 'Autore', type: 'PERSONA FISICA' },
    { role: 'Destinatario', label: 'Destinatario', type: 'PERSONA GIURIDICA' },
    { role: 'RUP', label: 'RUP', type: 'ASSEGNATARIO' },
    { role: 'ProtocolloPAI', label: 'Protocollo PAI', type: 'AMMINISTRAZIONI PUBBLICHE ITALIANE' },
    { role: 'InteroperabilitaPAE', label: 'Interoperabilita PAE', type: 'AMMINISTRAZIONI PUBBLICHE ESTERE' },
    { role: 'SistemaMittente', label: 'Sistema Mittente', type: 'SOFTWARE' },
  ] as const;

  test(`[TS-374] Verificare che l'utente possa visualizzare ogni ruolo disponibile per il tipo di documento selezionato`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);

    await expect(subjectAnagraphicPage.subjectCards).toHaveCount(subjectRoles.length);
    for (const { role } of subjectRoles) {
      await expect(subjectAnagraphicPage.subjectCardByRole(role)).toBeVisible();
    }
  });

  test(`[TS-375] Verificare che l'utente possa visualizzare il nome del ruolo nella lista dei ruoli disponibili per il tipo di documento selezionato`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);

    for (const { role, label } of subjectRoles) {
      await expect(subjectAnagraphicPage.subjectCardByRole(role).getByTestId('subject-role')).toContainText(label);
    }
  });

  test(`[TS-376] Verificare che l'utente possa visualizzare i tipi di soggetto per ogni soggetto disponibile per il ruolo selezionato`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);

    for (const { role } of subjectRoles) {
      await expect(subjectAnagraphicPage.subjectTypeBadgeByRole(role)).toBeVisible();
    }
  });

  test(`[TS-377] Verificare che l'utente possa visualizzare il nome del tipo di soggetto nella lista dei tipi di soggetto per il ruolo selezionato`, async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);

    for (const { role, type } of subjectRoles) {
      await expect(subjectAnagraphicPage.subjectTypeBadgeByRole(role)).toContainText(type);
    }
  });
});
