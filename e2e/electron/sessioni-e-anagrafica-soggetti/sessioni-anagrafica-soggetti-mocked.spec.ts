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

  test('[TS-181] Visualizzare la data di fine della sessione di versamento', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.DataFine')).toContainText('2026-04-07 16:15:12');
  });

  test('[TS-182] Messaggio assenza data fine se sessione di versamento non terminata', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneVersamento.DataFine': 'Sessione di versamento non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.DataFine')).toContainText('Sessione di versamento non terminata.');
  });

  test('[TS-183] Visualizzare UUID utente attivatore sessione versamento', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.UUIDAttivatore')).toContainText('USR-ATT-VERS-001');
  });

  test('[TS-184] Visualizzare UUID utente terminatore sessione versamento', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.UUIDTerminatore')).toContainText('USR-TERM-VERS-001');
  });

  test('[TS-185] Messaggio assenza UUID terminatore se sessione versamento non terminata', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneVersamento.UUIDTerminatore': 'Utente terminatore non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.UUIDTerminatore')).toContainText('sessione non terminata');
  });

  test('[TS-186] Visualizzare nome canale attivazione sessione versamento', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.CanaleAttivazione')).toContainText('PortaleWeb');
  });

  test('[TS-187] Visualizzare nome canale terminazione sessione versamento', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.CanaleTerminazione')).toContainText('API-Submission');
  });

  test('[TS-188] Messaggio assenza canale terminazione se sessione versamento non terminata', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneVersamento.CanaleTerminazione': 'Canale di terminazione non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.CanaleTerminazione')).toContainText('sessione non terminata');
  });

  test('[TS-189] Visualizzare lo stato della sessione di versamento', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneVersamento.Stato')).toContainText('TERMINATA');
  });

  test('[TS-190] Visualizzare info sessione conservazione processo selezionato', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.conservationProcessHeading).toBeVisible();
    await expect(sessionDetailsPage.conservationProcessRow('Processo:')).toContainText('PROC-CONS-001');
  });

  test('[TS-191] Visualizzare data inizio sessione conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.conservationProcessRow('Data Inizio:')).toContainText('2026-04-08 09:00:00');
  });

  test('[TS-192] Visualizzare data fine sessione conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.DataFine')).toContainText('2026-04-08 12:40:59');
  });

  test('[TS-193] Messaggio assenza data fine se sessione conservazione non terminata', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneConservazione.DataFine': 'Sessione di conservazione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.DataFine')).toContainText('Sessione di conservazione non terminata.');
  });

  test('[TS-194] Visualizzare UUID utente attivatore sessione conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.UUIDAttivatore')).toContainText('USR-ATT-CONS-001');
  });

  test('[TS-195] Visualizzare UUID utente terminatore sessione conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.UUIDTerminatore')).toContainText('USR-TERM-CONS-001');
  });

  test('[TS-196] Messaggio assenza UUID terminatore se sessione conservazione non terminata', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneConservazione.UUIDTerminatore': 'Utente terminatore non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.UUIDTerminatore')).toContainText('sessione non terminata');
  });

  test('[TS-197] Visualizzare nome canale attivazione sessione conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.CanaleAttivazione')).toContainText('ConservazioneBatch');
  });

  test('[TS-198] Visualizzare nome canale terminazione sessione conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.CanaleTerminazione')).toContainText('ConservazioneBatch');
  });

  test('[TS-199] Messaggio assenza canale terminazione se sessione conservazione non terminata', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        'SessioneConservazione.CanaleTerminazione': 'Canale terminazione non disponibile: sessione non terminata.',
      },
    });
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.CanaleTerminazione')).toContainText('sessione non terminata');
  });

  test('[TS-200] Visualizzare lo stato della sessione di conservazione', async ({ page }) => {
    const { sessionDetailsPage } = await openDocumentDetailWithMocks(page);
    await expect(sessionDetailsPage.sessionMetadataValue('SessioneConservazione.Stato')).toContainText('TERMINATA');
  });

  test('[TS-201] Visualizzare descrizione documento selezionato', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Metadati Principali', 'Descrizione:')).toContainText('Documento con note operative per il procedimento selezionato.');
  });

  test('[TS-202] Visualizzare lista soggetti coinvolti nel documento', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectsHeading).toBeVisible();
    await expect(subjectAnagraphicPage.subjectCards).toHaveCount(6);
  });

  test('[TS-203] Visualizzare ruolo del soggetto nel documento', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectCardByRole('Autore')).toBeVisible();
  });

  test('[TS-204] Visualizzare tipo di soggetto coinvolto', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectTypeBadgeByRole('Autore')).toContainText('PERSONA FISICA');
  });

  test('[TS-205] Visualizzare tutti i dati legati a soggetto tipo Persona Fisica', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Nome:')).toContainText('Mario');
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Cognome:')).toContainText('Rossi');
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'CodiceFiscale:')).toContainText('RSSMRA80A01H501U');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PF.IndirizziDigitali')).toContainText('mario.rossi@pec.it');
  });

  test('[TS-206] Visualizzare nome soggetto (Persona Fisica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Nome:')).toContainText('Mario');
  });

  test('[TS-207] Visualizzare cognome soggetto (Persona Fisica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'Cognome:')).toContainText('Rossi');
  });

  test('[TS-208] Visualizzare codice fiscale soggetto (Persona Fisica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Autore', 'CodiceFiscale:')).toContainText('RSSMRA80A01H501U');
  });

  test('[TS-209] Visualizzare indirizzi digitali riferimento (Persona Fisica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PF.IndirizziDigitali')).toContainText('mario.rossi@pec.it');
  });

  test('[TS-210] Visualizzare tutti i dati legati a soggetto tipo Persona Giuridica', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'DenominazioneOrganizzazione:')).toContainText('ACME S.p.A.');
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'CodiceFiscale_PartitaIva:')).toContainText('01234567890');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.CodiceFiscale')).toContainText('97654321000');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.DenominazioneUfficio')).toContainText('Ufficio Legale');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.IndirizziDigitali')).toContainText('acme@pec.it');
  });

  test('[TS-211] Visualizzare denominazione organizzazione (Persona Giuridica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'DenominazioneOrganizzazione:')).toContainText('ACME S.p.A.');
  });

  test('[TS-212] Visualizzare partita IVA soggetto (Persona Giuridica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectFieldByRole('Destinatario', 'CodiceFiscale_PartitaIva:')).toContainText('01234567890');
  });

  test('[TS-213] Visualizzare codice fiscale soggetto (Persona Giuridica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.CodiceFiscale')).toContainText('97654321000');
  });

  test('[TS-214] Visualizzare denominazione ufficio soggetto (Persona Giuridica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.DenominazioneUfficio')).toContainText('Ufficio Legale');
  });

  test('[TS-215] Visualizzare indirizzi digitali riferimento (Persona Giuridica)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PG.IndirizziDigitali')).toContainText('acme@pec.it');
  });

  test('[TS-216] Visualizzare tutti i dati legati a soggetto tipo AS', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectTypeBadgeByRole('RUP')).toContainText('ASSEGNATARIO');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Cognome')).toContainText('Verdi');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Nome')).toContainText('Giulia');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.CodiceFiscale')).toContainText('VRDGLI85C50H501R');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneOrganizzazione')).toContainText('Comune di Roma');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneUfficio')).toContainText('Servizi Demografici');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.IndirizziDigitali')).toContainText('demografici@pec.comune.roma.it');
  });

  test('[TS-217] Visualizzare cognome soggetto (AS)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Cognome')).toContainText('Verdi');
  });

  test('[TS-218] Visualizzare nome soggetto (AS)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.Nome')).toContainText('Giulia');
  });

  test('[TS-219] Visualizzare codice fiscale soggetto (AS)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.CodiceFiscale')).toContainText('VRDGLI85C50H501R');
  });

  test('[TS-220] Visualizzare denominazione organizzazione (AS)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneOrganizzazione')).toContainText('Comune di Roma');
  });

  test('[TS-221] Visualizzare denominazione ufficio soggetto (AS)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.DenominazioneUfficio')).toContainText('Servizi Demografici');
  });

  test('[TS-222] Visualizzare indirizzi digitali riferimento (AS)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.AS.IndirizziDigitali')).toContainText('demografici@pec.comune.roma.it');
  });

  test('[TS-223] Visualizzare tutti i dati legati a soggetto tipo PAI', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectTypeBadgeByRole('ProtocolloPAI')).toContainText('AMMINISTRAZIONI PUBBLICHE ITALIANE');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.DenominazioneAmministrazioneCodiceIPA')).toContainText('Comune di Torino - c_l219');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.AOO.CodiceIPA')).toContainText('AOO-TORINO-01');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.UOR.CodiceIPA')).toContainText('UOR-TORINO-42');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.IndirizziDigitali')).toContainText('protocollo@pec.comune.torino.it');
  });

  test('[TS-224] Visualizzare denominazione amministrazione e codice IPA (PAI)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.DenominazioneAmministrazioneCodiceIPA')).toContainText('Comune di Torino - c_l219');
  });

  test('[TS-225] Visualizzare denominazione amministrazione AOO e codice IPA AOO (PAI)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.AOO.CodiceIPA')).toContainText('AOO-TORINO-01');
  });

  test('[TS-226] Visualizzare denominazione amministrazione UOR e codice IPA UOR (PAI)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.UOR.CodiceIPA')).toContainText('UOR-TORINO-42');
  });

  test('[TS-227] Visualizzare indirizzi digitali riferimento (PAI)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAI.IndirizziDigitali')).toContainText('protocollo@pec.comune.torino.it');
  });

  test('[TS-228] Visualizzare tutti i dati legati a soggetto tipo PAE', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneAmministrazione')).toContainText('Ville de Paris');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneUfficio')).toContainText('Direction Generale');
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.IndirizziDigitali')).toContainText('courrier@paris.fr');
  });

  test('[TS-229] Visualizzare denominazione amministrazione soggetto (PAE)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneAmministrazione')).toContainText('Ville de Paris');
  });

  test('[TS-230] Visualizzare denominazione ufficio soggetto (PAE)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.DenominazioneUfficio')).toContainText('Direction Generale');
  });

  test('[TS-231] Visualizzare indirizzi digitali riferimento (PAE)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.PAE.IndirizziDigitali')).toContainText('courrier@paris.fr');
  });

  test('[TS-232] Visualizzare tutti i dati legati a soggetto tipo SW', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.subjectCardByRole('SistemaMittente')).toBeVisible();
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.SW.DenominazioneSistema')).toContainText('Sistema Interoperabilita ND');
  });

  test('[TS-233] Visualizzare denominazione sistema soggetto (SW)', async ({ page }) => {
    const { subjectAnagraphicPage } = await openDocumentDetailWithMocks(page);
    await expect(subjectAnagraphicPage.additionalSubjectMetadataValue('Soggetti.SW.DenominazioneSistema')).toContainText('Sistema Interoperabilita ND');
  });

  test('[TS-234] Visualizzare indice classificazione documento selezionato', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Indice:')).toContainText('A.12.04');
  });

  test('[TS-235] Visualizzare descrizione indice classificazione documento selezionato', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Descrizione:')).toContainText('Classificazione Atti Dirigenziali');
  });

  test('[TS-236] Visualizzare URI piano classificazione documento selezionato', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.rowByLabel('Classificazione', 'Piano (URI):')).toContainText('https://piano.example.gov/class/A.12.04');
  });

  test('[TS-237] Visualizzare tempo conservazione effettivo se diverso da aggregazione', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page);
    await expect(documentMetadataPage.additionalMetadataValue('TempoConservazioneEffettivo')).toContainText('10 anni (override documento)');
  });

  test('[TS-238] Messaggio coincidenza tempo conservazione con aggregazione', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page, {
      metadataOverrides: {
        TempoConservazioneMessaggio: 'Il tempo di conservazione coincide con quello dell aggregazione.',
      },
    });
    await expect(documentMetadataPage.additionalMetadataValue('TempoConservazioneMessaggio')).toContainText('coincide con quello dell aggregazione');
  });

  test('[TS-239] Visualizzare note relative al documento selezionato', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page, {
      noteValue: 'Nota operativa: controllare firma e allegati prima della chiusura.',
    });
    await expect(documentMetadataPage.rowByLabel('Metadati Principali', 'Descrizione:')).toContainText('Nota operativa: controllare firma e allegati prima della chiusura.');
  });

  test('[TS-240] Messaggio di informativa in caso di note assenti o vuote', async ({ page }) => {
    const { documentMetadataPage } = await openDocumentDetailWithMocks(page, {
      noteValue: '',
      metadataOverrides: {
        'NoteDocumento.Messaggio': 'Nessuna nota presente per il documento selezionato.',
      },
    });
    await expect(documentMetadataPage.additionalMetadataValue('NoteDocumento.Messaggio')).toContainText('Nessuna nota presente per il documento selezionato.');
  });
});
