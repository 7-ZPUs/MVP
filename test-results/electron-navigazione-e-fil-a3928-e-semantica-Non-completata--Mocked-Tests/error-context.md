# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: electron/navigazione-e-filtri-parte-1/dip-navigation-mocked.spec.ts >> Navigazione e Filtri Parte 1 - Mocked >> [TS-27] Verificare che l'utente possa visualizzare lo stato di indicizzazione semantica "Non completata"
- Location: e2e/electron/navigazione-e-filtri-parte-1/dip-navigation-mocked.spec.ts:207:7

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  getByTestId('search-semantic-toggle').or(getByLabel('Ricerca Semantica'))
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for getByTestId('search-semantic-toggle').or(getByLabel('Ricerca Semantica'))
    9 × locator resolved to <input type="checkbox" _ngcontent-ng-c3827249360="" formcontrolname="useSemanticSearch" data-testid="search-semantic-toggle" class="ng-untouched ng-pristine ng-valid"/>
      - unexpected value "visible"

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
      - button "Ricerca" [active] [ref=e15] [cursor=pointer]:
        - generic [ref=e17]: Ricerca
  - generic [ref=e18]:
    - complementary [ref=e19]:
      - tree [ref=e21]:
        - treeitem "Espandi nodo DIP" [ref=e24] [cursor=pointer]:
          - button "Espandi nodo" [ref=e25]
          - generic [ref=e26]: DIP
    - button "Mostra o nascondi albero" [ref=e28] [cursor=pointer]:
      - generic [ref=e29]: ◀
      - generic [ref=e30]: Albero
    - main [ref=e31]:
      - generic [ref=e33]:
        - generic [ref=e36]:
          - generic [ref=e37]:
            - textbox "Inserisci testo di ricerca..." [ref=e38]
            - button "Cerca" [ref=e39] [cursor=pointer]: Cerca
          - generic [ref=e41]:
            - generic [ref=e42] [cursor=pointer]:
              - radio "Nome Classe" [ref=e43]
              - text: Nome Classe
            - generic [ref=e44] [cursor=pointer]:
              - radio "ID Processo" [ref=e45]
              - text: ID Processo
            - generic [ref=e47] [cursor=pointer]:
              - checkbox "Ricerca Semantica" [ref=e48]
              - text: Ricerca Semantica
        - generic [ref=e49]:
          - complementary [ref=e50]:
            - generic [ref=e54]:
              - generic [ref=e55]:
                - heading "Comuni" [level=4] [ref=e56]
                - generic [ref=e58]:
                  - group [ref=e59]:
                    - generic "Dati Generali ▼" [ref=e60]
                    - option "Tutti i tipi" [selected]
                    - option "DOCUMENTO INFORMATICO"
                    - option "DOCUMENTO AMMINISTRATIVO INFORMATICO"
                    - option "AGGREGAZIONE DOCUMENTALE"
                  - group [ref=e61]:
                    - generic "Chiave Descrittiva ▼" [ref=e62]
                  - group [ref=e63]:
                    - generic "Classificazione ▼" [ref=e64]
              - generic [ref=e65]:
                - heading "Dati Documento (DiDai)" [level=4] [ref=e66]
                - group [ref=e68]:
                  - group [ref=e69]:
                    - generic "Registrazione ▼" [ref=e70]
                    - option "Tutti" [selected]
                    - option "ENTRATA"
                    - option "USCITA"
                    - option "INTERNO"
                    - option "Tutti" [selected]
                    - option "PROTOCOLLO ORDINARIO/EMERGENZA"
                    - option "REPERTORIO/REGISTRO"
                    - option "NESSUNO"
                  - group [ref=e71]:
                    - generic "Dati Base (DiDai) ▼" [ref=e72]
                    - option "Tutte" [selected]
                    - option "creazione tramite l’utilizzo di strumenti software che assicurino la produzione di documenti nei formati previsti nell’Allegato 2 delle Linee Guida"
                    - option "acquisizione di un documento informatico per via telematica o su supporto informatico, acquisizione della copia per immagine su supporto informatico di un documento analogico, acquisizione della copia informatica di un documento analogico"
                    - option "memorizzazione su supporto informatico in formato digitale delle informazioni risultanti da transazioni o processi informatici o dalla presentazione telematica di dati attraverso moduli o formulari resi disponibili all’utente"
                    - option "generazione o raggruppamento anche in via automatica di un insieme di dati o registrazioni, provenienti da una o più banche dati, anche appartenenti a più soggetti interoperanti, secondo una struttura logica predeterminata e memorizzata in forma statica"
                    - option "Tutti" [selected]
                    - option "Sì"
                    - option "No"
                  - group [ref=e73]:
                    - generic "Identificativo Formato ▼" [ref=e74]
                    - option "Tutti" [selected]
                    - option "PDF"
                    - option "WORD 2007"
                    - option "MS-DOC"
                    - option "ODT"
                    - option "RICHTEXT"
                    - option "EPUB"
                    - option "INDESIGNML"
                    - option "POSTSCRIPT"
                    - option "LATEX"
                    - option "XML"
                    - option "HTML"
                    - option "XHTML"
                    - option "XSD"
                    - option "XSL"
                    - option "XSLT"
                    - option "CSS"
                    - option "MARKDOWN"
                    - option "MATHML"
                    - option "SQL"
                    - option "ACCESS 2007"
                    - option "MS-MDB"
                    - option "ODB"
                    - option "JSON"
                    - option "JSON-LD"
                    - option "CSV"
                    - option "JWT"
                    - option "EML"
                    - option "MBOX"
                    - option "MS-PST"
                    - option "EXCEL 2007"
                    - option "POWERPOINT 2007"
                    - option "MS-XLS"
                    - option "MS-PPT"
                    - option "ODS"
                    - option "ODP"
                    - option "PNG"
                    - option "JPEG"
                    - option "TIFF"
                    - option "GIF"
                    - option "EXR"
                    - option "JPEG2000"
                    - option "DICOM"
                    - option "DNG"
                    - option "PSD"
                    - option "ARRIRAW"
                    - option "DPX"
                    - option "ACES"
                    - option "SVG"
                    - option "ILLUSTRATOR"
                    - option "ENCAPSULATED POSTSCRIPT"
                    - option "ODG"
                    - option "DXF"
                    - option "DWF"
                    - option "DWG"
                    - option "FBX"
                    - option "STL"
                    - option "OPENTYPE"
                    - option "TRUETYPE"
                    - option "WOFF"
                    - option "WAV"
                    - option "MP3"
                    - option "AIFF"
                    - option "FLAC"
                    - option "RAW"
                    - option "VORBIS"
                    - option "MUSICXML"
                    - option "MIDI"
                    - option "HEVC/H.265"
                    - option "H.264 / AVC"
                    - option "MP4V (MPEG-4 Part 2)"
                    - option "H.263 (XviD)"
                    - option "MPEG2 (MPEG-2 Part 2)"
                    - option "DNXHD / DNXHR"
                    - option "PRORES"
                  - group [ref=e75]:
                    - generic "Dati Verifica & Tracciature ▼" [ref=e76]
                    - option "Tutti" [selected]
                    - option "Sì"
                    - option "No"
                    - option "Tutti" [selected]
                    - option "Sì"
                    - option "No"
                    - option "Tutti" [selected]
                    - option "Sì"
                    - option "No"
                    - option "Tutti" [selected]
                    - option "Sì"
                    - option "No"
              - generic [ref=e77]:
                - heading "Dati di Aggregazione" [level=4] [ref=e78]
                - group [ref=e80]:
                  - group [ref=e81]:
                    - generic "Dati Aggregazione ▼" [ref=e82]
                    - option "Tutte" [selected]
                    - option "FASCICOLO"
                    - option "SERIE DOCUMENTALE"
                    - option "SERIE FASCICOLI"
                    - option "Tutte" [selected]
                    - option "AFFARE"
                    - option "ATTIVITÀ"
                    - option "PERSONA FISICA"
                    - option "PERSONA GIURIDICA"
                    - option "PROCEDIMENTO"
                  - group [ref=e83]:
                    - generic "Procedimento ▼" [ref=e84]
                  - group [ref=e85]:
                    - generic "Assegnazione ▼" [ref=e86]
                    - option "Tutte" [selected]
                    - option "PER COMPETENZA"
                    - option "PER CONOSCIENZA"
              - generic [ref=e87]:
                - heading "Metadati Personalizzati" [level=4] [ref=e88]
                - group [ref=e90]:
                  - group [ref=e91]:
                    - generic "Metadati Personalizzati ▼" [ref=e92]
              - generic [ref=e93]:
                - heading "Soggetti" [level=4] [ref=e94]
                - group "Filtri Soggetto" [ref=e96]:
                  - button "+ Aggiungi nuovo Soggetto" [ref=e98]
              - generic [ref=e99]:
                - button "Svuota Filtri" [ref=e100] [cursor=pointer]
                - button "Applica e Cerca" [ref=e101] [cursor=pointer]
          - button "Mostra o nascondi i filtri" [ref=e102] [cursor=pointer]:
            - generic [ref=e103]: ◀
            - generic [ref=e104]: Filtri
          - main [ref=e105]
```

# Test source

```ts
  109 |       const body = route.request().postDataJSON() as MockRequest;
  110 |       const mapped = ipcMap[body.channel];
  111 | 
  112 |       if (mapped === '__ERROR__') {
  113 |         await route.fulfill({
  114 |           status: 500,
  115 |           contentType: 'application/json',
  116 |           body: JSON.stringify({ message: `Errore mock su ${body.channel}` }),
  117 |         });
  118 |         return;
  119 |       }
  120 | 
  121 |       await route.fulfill({
  122 |         status: 200,
  123 |         contentType: 'application/json',
  124 |         body: JSON.stringify(mapped ?? []),
  125 |       });
  126 |     });
  127 |   });
  128 | 
  129 |   async function withIpcOverrides(page: Page, overrides: Record<string, unknown>): Promise<void> {
  130 |     await page.route('**/__e2e__/mock-ipc', async (route) => {
  131 |       const body = route.request().postDataJSON() as MockRequest;
  132 |       const baseMap = createDefaultIpcMap();
  133 |       const mapped = Object.prototype.hasOwnProperty.call(overrides, body.channel)
  134 |         ? overrides[body.channel]
  135 |         : baseMap[body.channel];
  136 | 
  137 |       if (mapped === '__ERROR__') {
  138 |         await route.fulfill({
  139 |           status: 500,
  140 |           contentType: 'application/json',
  141 |           body: JSON.stringify({ message: `Errore mock su ${body.channel}` }),
  142 |         });
  143 |         return;
  144 |       }
  145 | 
  146 |       await route.fulfill({
  147 |         status: 200,
  148 |         contentType: 'application/json',
  149 |         body: JSON.stringify(mapped ?? []),
  150 |       });
  151 |     });
  152 |   }
  153 | 
  154 |   async function gotoSearch(page: Page): Promise<DipNavigationPage> {
  155 |     const dipPage = new DipNavigationPage(page);
  156 |     await dipPage.gotoSearchPage();
  157 |     return dipPage;
  158 |   }
  159 | 
  160 |   async function openCommonFilterSections(dipPage: DipNavigationPage): Promise<void> {
  161 |     await dipPage.openFilterSection('Dati Generali');
  162 |     await dipPage.openFilterSection('Chiave Descrittiva');
  163 |     await dipPage.openFilterSection('Classificazione');
  164 |   }
  165 | 
  166 |   async function assertClassSearchResult(page: Page): Promise<void> {
  167 |     const dipPage = await gotoSearch(page);
  168 | 
  169 |     await dipPage.classNameRadio.check();
  170 |     await dipPage.search('Classe');
  171 | 
  172 |     const classCard = page.getByTestId('search-result-card').filter({ hasText: 'Classe Contratti' }).first();
  173 |     await expect(classCard).toBeVisible();
  174 |     await expect(classCard.getByTestId('search-result-title')).toHaveText('Classe Contratti');
  175 |     await expect(classCard.locator('.class-badge')).toHaveText('CLASSE');
  176 |     await expect(classCard.getByTestId('result-integrity-badge')).toContainText('VALID');
  177 |   }
  178 | 
  179 |   async function assertProcessSearchResult(page: Page): Promise<void> {
  180 |     const dipPage = await gotoSearch(page);
  181 | 
  182 |     await dipPage.processIdRadio.check();
  183 |     await dipPage.search('PROC-201');
  184 | 
  185 |     const processCard = page.getByTestId('search-result-card').filter({ hasText: 'PROC-201' }).first();
  186 |     await expect(processCard).toBeVisible();
  187 |     await expect(processCard.getByTestId('search-result-title')).toHaveText('PROC-201');
  188 |     await expect(processCard.getByTestId('result-integrity-badge')).toContainText('VALID');
  189 |   }
  190 | 
  191 |   async function assertDocumentSearchResult(page: Page): Promise<void> {
  192 |     const dipPage = await gotoSearch(page);
  193 | 
  194 |     await dipPage.search('Determina');
  195 | 
  196 |     const documentCard = page.getByTestId('search-result-card').filter({ hasText: 'Determina a contrarre.pdf' }).first();
  197 |     await expect(documentCard).toBeVisible();
  198 |     await expect(documentCard.getByTestId('search-result-title')).toHaveText('Determina a contrarre.pdf');
  199 |     await expect(documentCard.getByText('ID: DOC-301')).toBeVisible();
  200 |   }
  201 | 
  202 |   test(`[TS-26] Verificare che l'utente possa visualizzare lo stato dell'indicizzazione semantica`, async ({ page }) => {
  203 |     const dipPage = await gotoSearch(page);
  204 |     await expect(dipPage.semanticToggle).toBeHidden();
  205 |   });
  206 | 
  207 |   test(`[TS-27] Verificare che l'utente possa visualizzare lo stato di indicizzazione semantica "Non completata"`, async ({ page }) => {
  208 |     const dipPage = await gotoSearch(page);
> 209 |     await expect(dipPage.semanticToggle).toBeHidden();
      |                                          ^ Error: expect(locator).toBeHidden() failed
  210 |   });
  211 | 
  212 |   test(`[TS-28] Verificare che l'utente possa visualizzare lo stato di indicizzazione semantica "Completata"`, async ({ page }) => {
  213 |     const dipPage = await gotoSearch(page);
  214 |     await expect(dipPage.semanticToggle).toBeHidden();
  215 |   });
  216 | 
  217 |   test(`[TS-29] Verificare che il sistema renda disponibile un campo di ricerca`, async ({ page }) => {
  218 |     const dipPage = await gotoSearch(page);
  219 |     await expect(dipPage.searchInput).toBeVisible();
  220 |   });
  221 | 
  222 |   test(`[TS-30] Verificare che il sistema comunichi all'utente quando inserisce un valore non valido nel campo di ricerca`, async ({ page }) => {
  223 |     await withIpcOverrides(page, {
  224 |       'ipc:search:text': '__ERROR__',
  225 |     });
  226 | 
  227 |     const dipPage = await gotoSearch(page);
  228 |     await dipPage.processIdRadio.check();
  229 |     await dipPage.search('valore-non-uuid');
  230 | 
  231 |     await expect(dipPage.errorBanner).toContainText(/errore mock/i);
  232 |   });
  233 | 
  234 |   test(`[TS-31] Verificare che il sistema renda disponibile l'opzione di ricerca per documenti`, async ({ page }) => {
  235 |     await assertDocumentSearchResult(page);
  236 |   });
  237 | 
  238 |   test(`[TS-32] Verificare che il sistema renda disponibile l'opzione di ricerca per processi`, async ({ page }) => {
  239 |     const dipPage = await gotoSearch(page);
  240 |     await expect(dipPage.processIdRadio).toBeVisible();
  241 |   });
  242 | 
  243 |   test(`[TS-33] Verificare che l'utente possa cercare un processo esclusivamente per uuid`, async ({ page }) => {
  244 |     await assertProcessSearchResult(page);
  245 |   });
  246 | 
  247 |   test(`[TS-34] Verificare che il sistema renda disponibile l'opzione di ricerca per classi documentali`, async ({ page }) => {
  248 |     const dipPage = await gotoSearch(page);
  249 |     await expect(dipPage.classNameRadio).toBeVisible();
  250 |   });
  251 | 
  252 |   test(`[TS-35] Verificare che il sistema renda disponibile la ricerca avanzata con filtri`, async ({ page }) => {
  253 |     const dipPage = await gotoSearch(page);
  254 |     await expect(dipPage.applyFiltersButton).toBeVisible();
  255 |   });
  256 | 
  257 |   test(`[TS-36] Verificare che il sistema renda disponibile la sezione di filtri di ricerca comuni`, async ({ page }) => {
  258 |     const dipPage = await gotoSearch(page);
  259 |     await expect(page.getByTestId('filter-section-summary-general')).toBeVisible();
  260 |     await dipPage.openFilterSection('Dati Generali');
  261 |     await expect(dipPage.typeSelect).toBeVisible();
  262 |   });
  263 | 
  264 |   test(`[TS-37] Verificare che il sistema renda disponibile la sezione di filtri di ricerca specifici per tipo documentale`, async ({ page }) => {
  265 |     await gotoSearch(page);
  266 |     await expect(page.getByRole('heading', { name: 'Dati Documento (DiDai)' })).toBeVisible();
  267 |   });
  268 | 
  269 |   test(`[TS-38] Verificare che il sistema renda disponibile la sezione di filtri di ricerca specifici per metadati custom`, async ({ page }) => {
  270 |     await gotoSearch(page);
  271 |     await expect(page.getByRole('heading', { name: 'Metadati Personalizzati' })).toBeVisible();
  272 |   });
  273 | 
  274 |   test(`[TS-39] Verificare che il sistema permetta di applicare più filtri contemporaneamente`, async ({ page }) => {
  275 |     const dipPage = await gotoSearch(page);
  276 |     await openCommonFilterSections(dipPage);
  277 | 
  278 |     await dipPage.typeSelect.selectOption({ index: 1 });
  279 |     await dipPage.oggettoInput.fill('gara servizi');
  280 |     await dipPage.noteInput.fill('note test e2e');
  281 |     await dipPage.applyFiltersButton.click();
  282 | 
  283 |     await expect(dipPage.resultsTitle).toContainText('Trovati');
  284 |   });
  285 | 
  286 |   test(`[TS-40] Verificare che il sistema permetta di rimuovere i filtri applicati`, async ({ page }) => {
  287 |     const dipPage = await gotoSearch(page);
  288 |     await openCommonFilterSections(dipPage);
  289 | 
  290 |     await dipPage.noteInput.fill('note da cancellare');
  291 |     await dipPage.clearFiltersButton.click();
  292 | 
  293 |     await expect(dipPage.noteInput).toHaveValue('');
  294 |   });
  295 | 
  296 |   test(`[TS-41] Verificare che il sistema permetta di rimuovere tutti i filtri applicati`, async ({ page }) => {
  297 |     const dipPage = await gotoSearch(page);
  298 |     await openCommonFilterSections(dipPage);
  299 | 
  300 |     await dipPage.conservationYearsInput.fill('9999');
  301 |     await dipPage.noteInput.fill('note test e2e');
  302 |     await dipPage.oggettoInput.fill('gara servizi');
  303 |     await dipPage.clearFiltersButton.click();
  304 | 
  305 |     await expect(dipPage.conservationYearsInput).toHaveValue('');
  306 |     await expect(dipPage.noteInput).toHaveValue('');
  307 |     await expect(dipPage.oggettoInput).toHaveValue('');
  308 |   });
  309 | 
```