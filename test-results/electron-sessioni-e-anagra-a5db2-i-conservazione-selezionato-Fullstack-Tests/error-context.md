# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: electron/sessioni-e-anagrafica-soggetti/sessioni-anagrafica-soggetti-fullstack.spec.ts >> Sessioni e Anagrafica Soggetti - Fullstack >> [TS-242] Verificare che l'utente possa visualizzare le informazioni della sessione di versamento del processo di conservazione selezionato
- Location: e2e/electron/sessioni-e-anagrafica-soggetti/sessioni-anagrafica-soggetti-fullstack.spec.ts:56:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('conservation-process-heading').or(getByTestId('custom-metadata-heading'))
Expected: visible
Error: strict mode violation: getByTestId('conservation-process-heading').or(getByTestId('custom-metadata-heading')) resolved to 2 elements:
    1) <h3 _ngcontent-ng-c362917307="" data-testid="conservation-process-heading">Processo di Conservazione</h3> aka getByTestId('conservation-process-heading')
    2) <h3 _ngcontent-ng-c4085564236="" data-testid="custom-metadata-heading">Metadati Aggiuntivi</h3> aka getByTestId('custom-metadata-heading')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('conservation-process-heading').or(getByTestId('custom-metadata-heading'))

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Workspace Documentale
      - heading "DIPReader" [level=1] [ref=e7]
    - navigation "Navigazione principale" [ref=e8]:
      - button "Sezione Integrità" [ref=e9] [cursor=pointer]:
        - generic [ref=e11]: Sezione Integrità
      - button "Esplora" [ref=e12] [cursor=pointer]:
        - generic [ref=e14]: Esplora
      - button "Ricerca" [ref=e15] [cursor=pointer]:
        - generic [ref=e17]: Ricerca
  - generic [ref=e18]:
    - complementary [ref=e19]:
      - tree [ref=e21]:
        - generic [ref=e22]:
          - treeitem "Comprimi nodo DIP" [expanded] [ref=e24] [cursor=pointer]:
            - button "Comprimi nodo" [ref=e25]
            - generic [ref=e26]: DIP
          - treeitem "Comprimi nodo Registri IVA" [expanded] [ref=e28] [cursor=pointer]:
            - button "Comprimi nodo" [ref=e29]
            - generic [ref=e30]: Registri IVA
          - treeitem "Comprimi nodo Processo del 2025/11/10" [expanded] [ref=e32] [cursor=pointer]:
            - button "Comprimi nodo" [ref=e33]
            - generic [ref=e34]: Processo del 2025/11/10
          - treeitem "Comprimi nodo FilePrincipaleIPDV_10.pdf" [expanded] [active] [ref=e36] [cursor=pointer]:
            - button "Comprimi nodo" [ref=e37]
            - generic [ref=e38]: FilePrincipaleIPDV_10.pdf
          - treeitem "FilePrincipaleIPDV_10.pdf" [ref=e40] [cursor=pointer]:
            - generic [ref=e43]: FilePrincipaleIPDV_10.pdf
          - treeitem "Allegato_1.pdf" [ref=e45] [cursor=pointer]:
            - generic [ref=e48]: Allegato_1.pdf
          - treeitem "Allegato_2.pdf" [ref=e50] [cursor=pointer]:
            - generic [ref=e53]: Allegato_2.pdf
          - treeitem "Allegato_3.pdf" [ref=e55] [cursor=pointer]:
            - generic [ref=e58]: Allegato_3.pdf
          - treeitem "Allegato_4.pdf" [ref=e60] [cursor=pointer]:
            - generic [ref=e63]: Allegato_4.pdf
          - treeitem "Allegato_5.pdf" [ref=e65] [cursor=pointer]:
            - generic [ref=e68]: Allegato_5.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_11.pdf" [ref=e70] [cursor=pointer]:
            - button "Espandi nodo" [ref=e71]
            - generic [ref=e72]: FilePrincipaleIPDV_11.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_12.pdf" [ref=e74] [cursor=pointer]:
            - button "Espandi nodo" [ref=e75]
            - generic [ref=e76]: FilePrincipaleIPDV_12.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_13.pdf" [ref=e78] [cursor=pointer]:
            - button "Espandi nodo" [ref=e79]
            - generic [ref=e80]: FilePrincipaleIPDV_13.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_14.pdf" [ref=e82] [cursor=pointer]:
            - button "Espandi nodo" [ref=e83]
            - generic [ref=e84]: FilePrincipaleIPDV_14.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_15.pdf" [ref=e86] [cursor=pointer]:
            - button "Espandi nodo" [ref=e87]
            - generic [ref=e88]: FilePrincipaleIPDV_15.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_16.pdf" [ref=e90] [cursor=pointer]:
            - button "Espandi nodo" [ref=e91]
            - generic [ref=e92]: FilePrincipaleIPDV_16.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_17.pdf" [ref=e94] [cursor=pointer]:
            - button "Espandi nodo" [ref=e95]
            - generic [ref=e96]: FilePrincipaleIPDV_17.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_18.pdf" [ref=e98] [cursor=pointer]:
            - button "Espandi nodo" [ref=e99]
            - generic [ref=e100]: FilePrincipaleIPDV_18.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_19.pdf" [ref=e102] [cursor=pointer]:
            - button "Espandi nodo" [ref=e103]
            - generic [ref=e104]: FilePrincipaleIPDV_19.pdf
          - treeitem "Espandi nodo FilePrincipaleIPDV_20.pdf" [ref=e106] [cursor=pointer]:
            - button "Espandi nodo" [ref=e107]
            - generic [ref=e108]: FilePrincipaleIPDV_20.pdf
    - button "Mostra o nascondi albero" [ref=e110] [cursor=pointer]:
      - generic [ref=e111]: ◀
      - generic [ref=e112]: Albero
    - main [ref=e113]:
      - generic [ref=e115]:
        - generic [ref=e117]:
          - generic [ref=e118]: Azioni su Documento
          - generic [ref=e119]:
            - generic [ref=e120]: Sconosciuto
            - button "Verifica Integrità" [ref=e121] [cursor=pointer]: Verifica Integrità
            - generic [ref=e123]:
              - button "Stampa documento" [ref=e124] [cursor=pointer]: Stampa documento
              - button "Scarica documento" [ref=e126] [cursor=pointer]: Scarica documento
        - generic [ref=e129]:
          - generic [ref=e131]:
            - generic [ref=e132]: PDF
            - heading "FilePrincipaleIPDV_10.pdf" [level=2] [ref=e133]
          - button "Apri Anteprima" [ref=e135] [cursor=pointer]: Apri Anteprima
        - complementary [ref=e138]:
          - generic [ref=e140]:
            - heading "Dettaglio Documento" [level=2] [ref=e141]
            - generic [ref=e143]:
              - heading "Metadati Principali" [level=3] [ref=e144]
              - generic [ref=e145]:
                - generic [ref=e146]: "Identificativo:"
                - generic [ref=e147]: e2717093-efe4-4ebe-8ced-2ed92b26cdfc
              - generic [ref=e148]:
                - generic [ref=e149]: "Nome:"
                - generic [ref=e150]: FilePrincipaleIPDV_10.pdf
              - generic [ref=e151]:
                - generic [ref=e152]: "Oggetto:"
                - generic [ref=e153]: Prova Oggetto
              - generic [ref=e154]:
                - generic [ref=e155]: "Descrizione:"
                - generic [ref=e156]: Indicazioni aggiuntive utili ad indicare situazioni particolari.
              - generic [ref=e157]:
                - generic [ref=e158]: "Note:"
                - generic [ref=e159]: Indicazioni aggiuntive utili ad indicare situazioni particolari.
              - generic [ref=e160]:
                - generic [ref=e161]: "Tipo Doc:"
                - generic [ref=e162]: Registri IVA
              - generic [ref=e163]:
                - generic [ref=e164]: "Formazione:"
                - generic [ref=e165]: generazione o raggruppamento anche in via automatica di un insieme di dati o registrazioni, provenienti da una o più banche dati, anche appartenenti a più soggetti interoperanti, secondo una struttura logica predeterminata e memorizzata in forma statica
              - generic [ref=e166]:
                - generic [ref=e167]: "Parole Chiave:"
                - generic [ref=e168]: Prova parola chiave 1, Prova parola chiave 2
              - generic [ref=e169]:
                - generic [ref=e170]: "Riservatezza:"
                - generic [ref=e171]: "false"
              - generic [ref=e172]:
                - generic [ref=e173]: "Versione:"
                - generic [ref=e174]: "1"
              - generic [ref=e175]:
                - generic [ref=e176]: "Tempo Conservazione:"
                - generic [ref=e177]: "10"
              - generic [ref=e178]:
                - generic [ref=e179]: "Impronta (SHA-256):"
                - generic [ref=e180]: lS3z+jcbniVh32e7ndJxAhPw6dwNyzAiZ04TD8EoBmc=
            - generic [ref=e181]:
              - heading "Relazioni" [level=3] [ref=e182]
              - generic [ref=e183]:
                - generic [ref=e184]: "Aggregazione collegata:"
                - generic [ref=e185]: "12345"
            - generic [ref=e187]:
              - heading "Dati di Registrazione" [level=3] [ref=e188]
              - generic [ref=e189]:
                - generic [ref=e190]: "Registro:"
                - generic [ref=e191]: Repertorio\Registro
              - generic [ref=e192]:
                - generic [ref=e193]: "Flusso:"
                - generic [ref=e194]: E
              - generic [ref=e195]:
                - generic [ref=e196]: "Protocollo:"
                - generic [ref=e197]: N. 123456 del 2024/06/19 02:00
              - generic [ref=e198]:
                - generic [ref=e199]: "Codice:"
                - generic [ref=e200]: QAWSEDR13579
            - generic [ref=e202]:
              - heading "Classificazione" [level=3] [ref=e203]
              - generic [ref=e204]:
                - generic [ref=e205]: "Indice:"
                - generic [ref=e206]: 2A4B6C8D
              - generic [ref=e207]:
                - generic [ref=e208]: "Descrizione:"
                - generic [ref=e209]: Descrizione allegato 1
              - generic [ref=e210]:
                - generic [ref=e211]: "Piano (URI):"
                - generic [ref=e212]: URI del piano di classificazione pubblicato
            - generic [ref=e214]:
              - heading "Formato File" [level=3] [ref=e215]
              - generic [ref=e216]:
                - generic [ref=e217]: "Tipo/MIME:"
                - generic [ref=e218]: PDF
              - generic [ref=e219]:
                - generic [ref=e220]: "Prodotto:"
                - generic [ref=e221]: Non Rilevabile Non Rilevabile
              - generic [ref=e222]:
                - generic [ref=e223]: "Produttore:"
                - generic [ref=e224]: Non Rilevabile
            - generic [ref=e226]:
              - heading "Verifiche e Formati" [level=3] [ref=e227]
              - generic [ref=e228]:
                - generic [ref=e229]: "Firma Digitale:"
                - generic [ref=e230]: "false"
              - generic [ref=e231]:
                - generic [ref=e232]: "Sigillo:"
                - generic [ref=e233]: "false"
              - generic [ref=e234]:
                - generic [ref=e235]: "Marcatura Temporale:"
                - generic [ref=e236]: "false"
              - generic [ref=e237]:
                - generic [ref=e238]: "Conformità Copie:"
                - generic [ref=e239]: "false"
            - generic [ref=e241]:
              - heading "Allegati" [level=3] [ref=e242]
              - generic [ref=e243]:
                - generic [ref=e244]: "Numero Allegati:"
                - generic [ref=e245]: "5"
              - list [ref=e246]:
                - listitem [ref=e247]:
                  - generic [ref=e248]: 486fceea-ccbc-4ac4-96a9-997e62d6a105
                  - generic [ref=e249]: Descrizione allegato 1
                - listitem [ref=e250]:
                  - generic [ref=e251]: 31814f09-7f2e-4950-88bb-1906b382b7d3
                  - generic [ref=e252]: Descrizione allegato 2
                - listitem [ref=e253]:
                  - generic [ref=e254]: d779599d-d5b6-4233-9e63-9a0897401023
                  - generic [ref=e255]: Descrizione allegato 3
                - listitem [ref=e256]:
                  - generic [ref=e257]: c3f68d6d-bac6-4a79-973a-06b5b45cf75d
                  - generic [ref=e258]: Descrizione allegato 4
                - listitem [ref=e259]:
                  - generic [ref=e260]: 431b907c-0769-4558-b266-d2a5aa107262
                  - generic [ref=e261]: Descrizione allegato 5
            - generic [ref=e263]:
              - heading "Tracciamento Modifiche" [level=3] [ref=e264]
              - generic [ref=e265]:
                - generic [ref=e266]: "Tipo Modifica:"
                - generic [ref=e267]: N/A
              - generic [ref=e268]:
                - generic [ref=e269]: "Soggetto:"
                - generic [ref=e270]: N/A
              - generic [ref=e271]:
                - generic [ref=e272]: "Data:"
                - generic [ref=e273]: N/A
              - generic [ref=e275]: "ID Versione Precedente:"
            - generic [ref=e278]:
              - heading "Informazioni AIP" [level=3] [ref=e279]
              - generic [ref=e280]:
                - generic [ref=e281]: "Classe Documentale:"
                - generic [ref=e282]: N/A
              - generic [ref=e283]:
                - generic [ref=e284]: "UUID:"
                - generic [ref=e285]: e2717093-efe4-4ebe-8ced-2ed92b26cdfc
              - heading "Processo di Conservazione" [level=3] [ref=e286]
              - generic [ref=e287]:
                - generic [ref=e288]: "Processo:"
                - generic [ref=e289]: N/A
              - generic [ref=e290]:
                - generic [ref=e291]: "Sessione:"
                - generic [ref=e292]: N/A
              - generic [ref=e293]:
                - generic [ref=e294]: "Data Inizio:"
                - generic [ref=e295]: N/A
            - generic [ref=e297]:
              - heading "Metadati Aggiuntivi" [level=3] [ref=e298]
              - table [ref=e300]:
                - rowgroup [ref=e301]:
                  - row "Nome Valore" [ref=e302]:
                    - columnheader "Nome" [ref=e303]
                    - columnheader "Valore" [ref=e304]
                - rowgroup [ref=e305]:
                  - row "Nome Cliente Gamma Industries Inc." [ref=e306]:
                    - cell "Nome Cliente" [ref=e307]
                    - cell "Gamma Industries Inc." [ref=e308]
                  - row "Modalita Pagamento Bonifico Bancario" [ref=e309]:
                    - cell "Modalita Pagamento" [ref=e310]
                    - cell "Bonifico Bancario" [ref=e311]
                  - row "Valore IVA 5" [ref=e312]:
                    - cell "Valore IVA" [ref=e313]
                    - cell "5" [ref=e314]
                  - row "Data Pagamento 2024-06-19" [ref=e315]:
                    - cell "Data Pagamento" [ref=e316]
                    - cell "2024-06-19" [ref=e317]
                  - row "Pagato true" [ref=e318]:
                    - cell "Pagato" [ref=e319]
                    - cell "true" [ref=e320]
            - generic [ref=e322]:
              - heading "Soggetti" [level=3] [ref=e323]
              - generic [ref=e324]:
                - generic [ref=e325]:
                  - generic [ref=e326]:
                    - generic [ref=e327]: Soggetto Che Effettua La Registrazione
                    - generic [ref=e328]: PERSONA GIURIDICA
                  - generic [ref=e330]:
                    - generic [ref=e331]: "Denominazione Organizzazione:"
                    - generic [ref=e332]: ARCHIVERSE
                - generic [ref=e333]:
                  - generic [ref=e334]:
                    - generic [ref=e335]: Mittente
                    - generic [ref=e336]: PERSONA GIURIDICA
                  - generic [ref=e337]:
                    - generic [ref=e338]:
                      - generic [ref=e339]: "Codice Fiscale Partita Iva:"
                      - generic [ref=e340]: "46"
                    - generic [ref=e341]:
                      - generic [ref=e342]: "Denominazione Organizzazione:"
                      - generic [ref=e343]: ARK SRL
                    - generic [ref=e344]:
                      - generic [ref=e345]: "Denominazione Ufficio:"
                      - generic [ref=e346]: Ufficio Protocollo
                    - generic [ref=e347]:
                      - generic [ref=e348]: "Indirizzi Digitali Di Riferimento:"
                      - generic [ref=e349]: protocollo1@ARK.it, protocollo2@ARK.it, protocollo3@ARK.it
                - generic [ref=e350]:
                  - generic [ref=e351]:
                    - generic [ref=e352]: Destinatario
                    - generic [ref=e353]: PERSONA GIURIDICA
                  - generic [ref=e354]:
                    - generic [ref=e355]:
                      - generic [ref=e356]: "Codice Fiscale Partita Iva:"
                      - generic [ref=e357]: "31140103768"
                    - generic [ref=e358]:
                      - generic [ref=e359]: "Denominazione Organizzazione:"
                      - generic [ref=e360]: Omega Global S.p.A.
```

# Test source

```ts
  1  | import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
  2  | import path from 'node:path';
  3  | import { DocumentMetadataPage } from './document-metadata.page';
  4  | import { SessionDetailsPage } from './session-details.page';
  5  | import { SubjectAnagraphicPage } from './subject-anagraphic.page';
  6  | 
  7  | test.describe('Sessioni e Anagrafica Soggetti - Fullstack', () => {
  8  |   test.describe.configure({ timeout: 60000 });
  9  | 
  10 |   let app: ElectronApplication;
  11 |   let page: Page;
  12 | 
  13 |   test.beforeEach(async () => {
  14 |     const repoRoot = path.resolve(__dirname, '../../..');
  15 | 
  16 |     app = await electron.launch({
  17 |       args: [repoRoot],
  18 |       env: {
  19 |         ...process.env,
  20 |         NODE_ENV: 'development',
  21 |         ELECTRON_DISABLE_SANDBOX: '1',
  22 |       },
  23 |     });
  24 | 
  25 |     page = await app.firstWindow();
  26 |     await page.waitForLoadState('domcontentloaded');
  27 |   });
  28 | 
  29 |   test.afterEach(async () => {
  30 |     await app.close();
  31 |   });
  32 | 
  33 |   async function ensureMainPageReady(): Promise<void> {
  34 |     const windows = app.windows();
  35 |     for (const win of windows) {
  36 |       const searchButton = win.getByRole('button', { name: 'Ricerca' });
  37 |       if (await searchButton.isVisible().catch(() => false)) {
  38 |         page = win;
  39 |         return;
  40 |       }
  41 |     }
  42 | 
  43 |     await expect(page.getByRole('button', { name: 'Ricerca' })).toBeVisible({ timeout: 15000 });
  44 |   }
  45 | 
  46 |   async function openFirstDocumentDetail(): Promise<void> {
  47 |     const treeToggles = page.getByTestId('dip-tree-toggle');
  48 |     const treeNodes = page.getByTestId('dip-tree-node');
  49 | 
  50 |     await treeToggles.nth(0).click();
  51 |     await treeToggles.nth(1).click();
  52 |     await treeToggles.nth(2).click();
  53 |     await treeNodes.nth(3).click();
  54 |   }
  55 | 
  56 |   test(`[TS-242] Verificare che l'utente possa visualizzare le informazioni della sessione di versamento del processo di conservazione selezionato`, async () => {
  57 |     await ensureMainPageReady();
  58 |     await openFirstDocumentDetail();
  59 | 
  60 |     const documentMetadataPage = new DocumentMetadataPage(page);
  61 |     const sessionDetailsPage = new SessionDetailsPage(page);
  62 | 
  63 |     await expect(documentMetadataPage.detailTitle).toBeVisible();
  64 |     await expect(documentMetadataPage.mainMetadataHeading).toBeVisible();
  65 |     await expect(
  66 |       sessionDetailsPage.conservationProcessHeading.or(documentMetadataPage.additionalMetadataHeading),
> 67 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  68 |   });
  69 | 
  70 |   test(`[TS-265] Verificare che l'utente possa visualizzare la lista dei soggetti coinvolti nel documento selezionato`, async () => {
  71 |     await ensureMainPageReady();
  72 |     await openFirstDocumentDetail();
  73 | 
  74 |     const documentMetadataPage = new DocumentMetadataPage(page);
  75 |     const subjectAnagraphicPage = new SubjectAnagraphicPage(page);
  76 | 
  77 |     await expect(documentMetadataPage.classificationHeading).toBeVisible();
  78 |     await expect(documentMetadataPage.rowByLabel('Classificazione', 'Indice:')).toBeVisible();
  79 |     await expect(subjectAnagraphicPage.subjectsHeading).toBeVisible();
  80 |   });
  81 | });
  82 | 
```