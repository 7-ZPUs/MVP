# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: electron/integrita-e-provenienza/integrita-e-provenienza-mocked.spec.ts >> Integrita e Provenienza - Mocked >> [TS-201] Verificare che l'utente possa visualizzare il report di integrità dettagliato per una singola classe documentale
- Location: e2e/electron/integrita-e-provenienza/integrita-e-provenienza-mocked.spec.ts:268:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="integrity-report-detail"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="integrity-report-detail"]')

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
        - treeitem "Espandi nodo DIP" [ref=e24] [cursor=pointer]:
          - button "Espandi nodo" [ref=e25]
          - generic [ref=e26]: DIP
    - button "Mostra o nascondi albero" [ref=e28] [cursor=pointer]:
      - generic [ref=e29]: ◀
      - generic [ref=e30]: Albero
    - main [ref=e31]:
      - generic [ref=e33]:
        - generic [ref=e35]:
          - generic [ref=e36]: Azioni su Documento
          - generic [ref=e37]:
            - generic [ref=e38]: Verificato
            - button "Verifica Integrità" [ref=e39] [cursor=pointer]: Verifica Integrità
            - generic [ref=e41]:
              - button "Stampa documento" [ref=e42] [cursor=pointer]: Stampa documento
              - button "Scarica documento" [ref=e44] [cursor=pointer]: Scarica documento
        - generic [ref=e47]:
          - generic [ref=e49]:
            - generic [ref=e50]: PDF
            - heading "verbale.pdf" [level=2] [ref=e51]
          - button "Apri Anteprima" [ref=e53] [cursor=pointer]: Apri Anteprima
        - complementary [ref=e56]:
          - generic [ref=e58]:
            - heading "Dettaglio Documento" [level=2] [ref=e59]
            - generic [ref=e61]:
              - heading "Metadati Principali" [level=3] [ref=e62]
              - generic [ref=e63]:
                - generic [ref=e64]: "Identificativo:"
                - generic [ref=e65]: N/A
              - generic [ref=e66]:
                - generic [ref=e67]: "Nome:"
                - generic [ref=e68]: verbale.pdf
              - generic [ref=e69]:
                - generic [ref=e70]: "Oggetto:"
                - generic [ref=e71]: Verbale commissione
              - generic [ref=e73]: "Descrizione:"
              - generic [ref=e75]:
                - generic [ref=e76]: "Tipo Doc:"
                - generic [ref=e77]: Verbale
              - generic [ref=e78]:
                - generic [ref=e79]: "Formazione:"
                - generic [ref=e80]: Generazione
              - generic [ref=e81]:
                - generic [ref=e82]: "Riservatezza:"
                - generic [ref=e83]: "false"
              - generic [ref=e84]:
                - generic [ref=e85]: "Versione:"
                - generic [ref=e86]: "1"
            - generic [ref=e88]:
              - heading "Dati di Registrazione" [level=3] [ref=e89]
              - generic [ref=e90]:
                - generic [ref=e91]: "Registro:"
                - generic [ref=e92]: N/A
              - generic [ref=e93]:
                - generic [ref=e94]: "Flusso:"
                - generic [ref=e95]: N/A
              - generic [ref=e96]:
                - generic [ref=e97]: "Protocollo:"
                - generic [ref=e98]: N. N/A del N/A
              - generic [ref=e99]:
                - generic [ref=e100]: "Codice:"
                - generic [ref=e101]: N/A
            - generic [ref=e103]:
              - heading "Classificazione" [level=3] [ref=e104]
              - generic [ref=e105]:
                - generic [ref=e106]: "Indice:"
                - generic [ref=e107]: N/A
              - generic [ref=e108]:
                - generic [ref=e109]: "Descrizione:"
                - generic [ref=e110]: N/A
              - generic [ref=e111]:
                - generic [ref=e112]: "Piano (URI):"
                - generic [ref=e113]: N/A
            - generic [ref=e115]:
              - heading "Formato File" [level=3] [ref=e116]
              - generic [ref=e117]:
                - generic [ref=e118]: "Tipo/MIME:"
                - generic [ref=e119]: N/A
              - generic [ref=e120]:
                - generic [ref=e121]: "Prodotto:"
                - generic [ref=e122]: N/A N/A
              - generic [ref=e123]:
                - generic [ref=e124]: "Produttore:"
                - generic [ref=e125]: N/A
            - generic [ref=e127]:
              - heading "Verifiche e Formati" [level=3] [ref=e128]
              - generic [ref=e129]:
                - generic [ref=e130]: "Firma Digitale:"
                - generic [ref=e131]: N/A
              - generic [ref=e132]:
                - generic [ref=e133]: "Sigillo:"
                - generic [ref=e134]: N/A
              - generic [ref=e135]:
                - generic [ref=e136]: "Marcatura Temporale:"
                - generic [ref=e137]: N/A
              - generic [ref=e138]:
                - generic [ref=e139]: "Conformità Copie:"
                - generic [ref=e140]: N/A
            - generic [ref=e142]:
              - heading "Allegati" [level=3] [ref=e143]
              - generic [ref=e144]:
                - generic [ref=e145]: "Numero Allegati:"
                - generic [ref=e146]: "0"
              - paragraph [ref=e147]: Nessun dettaglio allegato presente.
            - generic [ref=e149]:
              - heading "Tracciamento Modifiche" [level=3] [ref=e150]
              - generic [ref=e151]:
                - generic [ref=e152]: "Tipo Modifica:"
                - generic [ref=e153]: N/A
              - generic [ref=e154]:
                - generic [ref=e155]: "Soggetto:"
                - generic [ref=e156]: N/A
              - generic [ref=e157]:
                - generic [ref=e158]: "Data:"
                - generic [ref=e159]: N/A
              - generic [ref=e161]: "ID Versione Precedente:"
            - generic [ref=e164]:
              - heading "Informazioni AIP" [level=3] [ref=e165]
              - generic [ref=e166]:
                - generic [ref=e167]: "Classe Documentale:"
                - generic [ref=e168]: Classe Contratti
              - generic [ref=e169]:
                - generic [ref=e170]: "UUID:"
                - generic [ref=e171]: AIP-UUID-301
              - heading "Processo di Conservazione" [level=3] [ref=e172]
              - generic [ref=e173]:
                - generic [ref=e174]: "Processo:"
                - generic [ref=e175]: PROC-CONS-001
              - generic [ref=e176]:
                - generic [ref=e177]: "Sessione:"
                - generic [ref=e178]: N/A
              - generic [ref=e179]:
                - generic [ref=e180]: "Data Inizio:"
                - generic [ref=e181]: 08/04/2026 10:30:45
            - generic [ref=e183]:
              - heading "Metadati Aggiuntivi" [level=3] [ref=e184]
              - table [ref=e186]:
                - rowgroup [ref=e187]:
                  - row "Nome Valore" [ref=e188]:
                    - columnheader "Nome" [ref=e189]
                    - columnheader "Valore" [ref=e190]
                - rowgroup [ref=e191]:
                  - row "Classe Documentale Classe Contratti" [ref=e192]:
                    - cell "Classe Documentale" [ref=e193]
                    - cell "Classe Contratti" [ref=e194]
                  - row "Preservation Process UUID PROC-CONS-001" [ref=e195]:
                    - cell "Preservation Process UUID" [ref=e196]
                    - cell "PROC-CONS-001" [ref=e197]
                  - row "Preservation Process Date 08/04/2026 10:30:45" [ref=e198]:
                    - cell "Preservation Process Date" [ref=e199]
                    - cell "08/04/2026 10:30:45" [ref=e200]
                  - row "Oggetto Verbale commissione" [ref=e201]:
                    - cell "Oggetto" [ref=e202]
                    - cell "Verbale commissione" [ref=e203]
            - generic [ref=e205]:
              - generic [ref=e206]: ℹ️
              - generic [ref=e207]: Nessun soggetto associato al documento
```

# Test source

```ts
  176 | 
  177 |     await expect.poll(() => calls.includes('file:download')).toBeTruthy();
  178 |   });
  179 | 
  180 |   test(`[TS-228] Verificare che l'utente possa visualizzare le informazioni dell'AiP di provenienza di un documento selezionato`, async ({ page }) => {
  181 |     await installMockIpc(page);
  182 | 
  183 |     const aipDetailsPage = new AipDetailsPage(page);
  184 |     await aipDetailsPage.openDocumentDetailFromTree();
  185 | 
  186 |     await expect(aipDetailsPage.aipHeading).toBeVisible();
  187 |   });
  188 | 
  189 |   test(`[TS-229] Verificare che l'utente possa visualizzare la classe documentale di appartenenza dell'AiP relativo al documento selezionato`, async ({ page }) => {
  190 |     await installMockIpc(page);
  191 | 
  192 |     const aipDetailsPage = new AipDetailsPage(page);
  193 |     await aipDetailsPage.openDocumentDetailFromTree();
  194 | 
  195 |     await expect(aipDetailsPage.aipClassRow).toContainText('Classe Contratti');
  196 |   });
  197 | 
  198 |   test(`[TS-230] Verificare che l'utente possa visualizzare lo UUID dell'AiP relativo al documento selezionato`, async ({ page }) => {
  199 |     await installMockIpc(page);
  200 | 
  201 |     const aipDetailsPage = new AipDetailsPage(page);
  202 |     await aipDetailsPage.openDocumentDetailFromTree();
  203 | 
  204 |     await expect(aipDetailsPage.aipUuidRow).toContainText('AIP-UUID-301');
  205 |   });
  206 | 
  207 |   test(`[TS-231] Verificare che l'utente possa visualizzare le informazioni del processo di conservazione dell'AiP`, async ({ page }) => {
  208 |     await installMockIpc(page);
  209 | 
  210 |     const aipDetailsPage = new AipDetailsPage(page);
  211 |     await aipDetailsPage.openDocumentDetailFromTree();
  212 | 
  213 |     await expect(aipDetailsPage.conservationHeading).toBeVisible();
  214 |     await expect(aipDetailsPage.conservationProcessRow).toContainText('PROC-CONS-001');
  215 |   });
  216 | 
  217 |   test(`[TS-232] Verificare che l'utente possa visualizzare la data di inizio di un processo o sessione`, async ({ page }) => {
  218 |     await installMockIpc(page);
  219 | 
  220 |     const aipDetailsPage = new AipDetailsPage(page);
  221 |     await aipDetailsPage.openDocumentDetailFromTree();
  222 | 
  223 |     await expect(aipDetailsPage.conservationStartDateRow).toContainText('08/04/2026 10:30:45');
  224 |   });
  225 | 
  226 |   test(`[TS-242] Verificare che l'utente possa visualizzare le informazioni della sessione di versamento del processo di conservazione selezionato`, async ({ page }) => {
  227 |     await installMockIpc(page);
  228 | 
  229 |     const aipDetailsPage = new AipDetailsPage(page);
  230 |     await aipDetailsPage.openDocumentDetailFromTree();
  231 | 
  232 |     await expect(aipDetailsPage.conservationSessionRow).toContainText('N/A');
  233 |   });
  234 | 
  235 |   test(`[TS-243] Verificare che l'utente possa visualizzare la data di inizio della sessione di versamento`, async ({ page }) => {
  236 |     await installMockIpc(page);
  237 | 
  238 |     const aipDetailsPage = new AipDetailsPage(page);
  239 |     await aipDetailsPage.openDocumentDetailFromTree();
  240 | 
  241 |     await expect(aipDetailsPage.conservationStartDateRow).toContainText('08/04/2026 10:30:45');
  242 |   });
  243 | 
  244 |   test(
  245 |     `[TS-199] Verificare che l'utente possa visualizzare la data e l'ora di inizio della verifica del DIP nel formato "GG/MM/AAAA HH:MM:SS"`,
  246 |     async ({ page }) => {
  247 |       await installMockIpc(page);
  248 | 
  249 |       const integrityPage = new IntegrityPage(page);
  250 |       await integrityPage.gotoDashboard();
  251 | 
  252 |       await expect(page.getByTestId('integrity-verification-start-date')).toBeVisible();
  253 |     },
  254 |   );
  255 | 
  256 |   test(
  257 |     `[TS-200] Verificare che l'utente sia informato con un messaggio nel caso in cui non vi siano classi corrotte`,
  258 |     async ({ page }) => {
  259 |       await installMockIpc(page);
  260 | 
  261 |       const integrityPage = new IntegrityPage(page);
  262 |       await integrityPage.gotoDashboard();
  263 | 
  264 |       await expect(page.getByText(/non vi siano classi corrotte/i)).toBeVisible();
  265 |     },
  266 |   );
  267 | 
  268 |   test(
  269 |     `[TS-201] Verificare che l'utente possa visualizzare il report di integrità dettagliato per una singola classe documentale`,
  270 |     async ({ page }) => {
  271 |       await installMockIpc(page);
  272 | 
  273 |       const aipDetailsPage = new AipDetailsPage(page);
  274 |       await aipDetailsPage.openDocumentDetailFromTree();
  275 | 
> 276 |       await expect(page.locator('[data-testid="integrity-report-detail"]')).toBeVisible();
      |                                                                             ^ Error: expect(locator).toBeVisible() failed
  277 |     },
  278 |   );
  279 | 
  280 |   async function assertBaselineIntegrityAndDetail(page: Page): Promise<void> {
  281 |     await installMockIpc(page);
  282 | 
  283 |     const integrityPage = new IntegrityPage(page);
  284 |     await integrityPage.gotoDashboard();
  285 | 
  286 |     await expect(integrityPage.startVerificationButton).toBeVisible();
  287 |     await expect(integrityPage.validElementsNumber).toBeVisible();
  288 |     await expect(integrityPage.invalidElementsNumber).toBeVisible();
  289 |     await expect(integrityPage.unverifiedElementsNumber).toBeVisible();
  290 |     await expect(integrityPage.validPanelHeading).toBeVisible();
  291 | 
  292 |     const aipDetailsPage = new AipDetailsPage(page);
  293 |     await aipDetailsPage.openDocumentDetailFromTree();
  294 | 
  295 |     await expect(aipDetailsPage.documentDetailTitle).toBeVisible();
  296 |     await expect(aipDetailsPage.aipHeading).toBeVisible();
  297 |     await expect(aipDetailsPage.aipUuidRow).toContainText('AIP-UUID-301');
  298 |   }
  299 | 
  300 |   test(`[TS-184] Verificare che se la stampa non è disponibile, l'utente possa visualizzare un messaggio di stampa non avvenuta`, async ({ page }) => {
  301 |     await assertBaselineIntegrityAndDetail(page);
  302 |   });
  303 | 
  304 |   test(`[TS-187] Verificare che l'utente possa avviare la verifica della classe documentale`, async ({ page }) => {
  305 |     await assertBaselineIntegrityAndDetail(page);
  306 |   });
  307 | 
  308 |   test(`[TS-188] Verificare che l'utente possa visualizzare lo stato di verifica della classe documentale`, async ({ page }) => {
  309 |     await assertBaselineIntegrityAndDetail(page);
  310 |   });
  311 | 
  312 |   test(`[TS-189] Verificare che l'utente possa avviare la verifica dell'integrità processo`, async ({ page }) => {
  313 |     await assertBaselineIntegrityAndDetail(page);
  314 |   });
  315 | 
  316 |   test(`[TS-190] Verificare che l'utente possa visualizzare lo stato di verifica dell'integrità processo`, async ({ page }) => {
  317 |     await assertBaselineIntegrityAndDetail(page);
  318 |   });
  319 | 
  320 |   test(`[TS-192] Verificare che l'utente possa visualizzare lo stato di verifica del documento`, async ({ page }) => {
  321 |     await assertBaselineIntegrityAndDetail(page);
  322 |   });
  323 | 
  324 |   test(`[TS-194] Verificare che l'utente possa visualizzare il conteggio totale delle classi documentali verificate nel report del DIP`, async ({ page }) => {
  325 |     await assertBaselineIntegrityAndDetail(page);
  326 |   });
  327 | 
  328 |   test(`[TS-195] Verificare che l'utente possa visualizzare il numero di classi integre (stato "Valido") in colore verde nel report del DIP`, async ({ page }) => {
  329 |     await assertBaselineIntegrityAndDetail(page);
  330 |   });
  331 | 
  332 |   test(`[TS-196] Verificare che l'utente possa visualizzare il numero di classi corrotte (stato "Non Valido") in colore rosso nel report del DIP`, async ({ page }) => {
  333 |     await assertBaselineIntegrityAndDetail(page);
  334 |   });
  335 | 
  336 |   test(`[TS-197] Verificare che l'utente possa visualizzare l'elenco delle classi corrotte indicando nome e numero di processi corrotti per ciascuna`, async ({ page }) => {
  337 |     await assertBaselineIntegrityAndDetail(page);
  338 |   });
  339 | 
  340 |   test(`[TS-198] Verificare che l'utente possa visualizzare la classe corrotta indicando nome e numero di processi corrotti`, async ({ page }) => {
  341 |     await assertBaselineIntegrityAndDetail(page);
  342 |   });
  343 | 
  344 |   test(`[TS-202] Verificare che l'utente possa visualizzare il conteggio dei processi verificati all'interno della classe documentale`, async ({ page }) => {
  345 |     await assertBaselineIntegrityAndDetail(page);
  346 |   });
  347 | 
  348 |   test(`[TS-203] Verificare che l'utente possa visualizzare il numero di processi integri (stato "Valido") in colore verde nella classe documentale`, async ({ page }) => {
  349 |     await assertBaselineIntegrityAndDetail(page);
  350 |   });
  351 | 
  352 |   test(`[TS-204] Verificare che l'utente possa visualizzare il numero di processi corrotti (stato "Non Valido") in colore rosso nella classe documentale`, async ({ page }) => {
  353 |     await assertBaselineIntegrityAndDetail(page);
  354 |   });
  355 | 
  356 |   test(`[TS-205] Verificare che l'utente possa visualizzare la lista dei processi corrotti con il relativo numero di documenti compromessi`, async ({ page }) => {
  357 |     await assertBaselineIntegrityAndDetail(page);
  358 |   });
  359 | 
  360 |   test(`[TS-206] Verificare che l'utente possa visualizzare il singolo processo corrotto con il relativo numero di documenti compromessi`, async ({ page }) => {
  361 |     await assertBaselineIntegrityAndDetail(page);
  362 |   });
  363 | 
  364 |   test(`[TS-207] Verificare che l'utente possa visualizzare la data e l'ora di inizio della verifica della classe nel formato "GG/MM/AAAA HH:MM:SS"`, async ({ page }) => {
  365 |     await assertBaselineIntegrityAndDetail(page);
  366 |   });
  367 | 
  368 |   test(`[TS-208] Verificare che l'utente sia informato che tutti i processi sono integri`, async ({ page }) => {
  369 |     await assertBaselineIntegrityAndDetail(page);
  370 |   });
  371 | 
  372 |   test(`[TS-209] Verificare che l'utente possa visualizzare il report di integrità dettagliato di un singolo processo`, async ({ page }) => {
  373 |     await assertBaselineIntegrityAndDetail(page);
  374 |   });
  375 | 
  376 |   test(`[TS-210] Verificare che l'utente possa visualizzare il conteggio dei documenti verificati all'interno del processo selezionato`, async ({ page }) => {
```