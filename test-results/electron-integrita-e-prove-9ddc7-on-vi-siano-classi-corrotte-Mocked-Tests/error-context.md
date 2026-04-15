# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: electron/integrita-e-provenienza/integrita-e-provenienza-mocked.spec.ts >> Integrita e Provenienza - Mocked >> [TS-200] Verificare che l'utente sia informato con un messaggio nel caso in cui non vi siano classi corrotte
- Location: e2e/electron/integrita-e-provenienza/integrita-e-provenienza-mocked.spec.ts:256:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/non vi siano classi corrotte/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/non vi siano classi corrotte/i)

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
      - main [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - heading "Stato Integrità DIP" [level=2] [ref=e36]
            - paragraph [ref=e37]: Fotografia attuale delle verifiche crittografiche.
          - button "Avvia Nuova Verifica Globale" [ref=e38] [cursor=pointer]
        - region "Riepilogo statistico delle verifiche" [ref=e40]:
          - generic [ref=e43]:
            - generic "Elementi Integri:" [ref=e44]: "2"
            - generic [ref=e45]: Elementi Integri
          - generic [ref=e48]:
            - generic "Elementi Corrotti:" [ref=e49]: "2"
            - generic [ref=e50]: Elementi Corrotti
          - generic [ref=e53]:
            - generic "In Attesa di Verifica:" [ref=e54]: "0"
            - generic [ref=e55]: In Attesa di Verifica
        - region "Classi Analizzate" [ref=e57]:
          - generic [ref=e58]:
            - heading "Classi Analizzate" [level=3] [ref=e59]: Classi Analizzate
            - paragraph [ref=e61]: Le classi non valide includono il dettaglio di processo e documento che le invalida.
          - list "Elenco delle classi analizzate" [ref=e62]:
            - listitem [ref=e63]:
              - group [ref=e64]:
                - 'generic "▸ Classe Classe Contratti Stato: Invalido 1 documento/i" [ref=e65] [cursor=pointer]':
                  - text: ▸
                  - generic [ref=e66]:
                    - generic [ref=e67]: Classe
                    - strong [ref=e68]: Classe Contratti
                  - generic [ref=e69]:
                    - 'generic "Stato: Invalido" [ref=e70]': Invalido
                    - generic [ref=e71]: 1 documento/i
                - list [ref=e72]:
                  - listitem [ref=e73]:
                    - group [ref=e74]:
                      - generic "▸ Processo PROC-201 1 documento/i" [ref=e75] [cursor=pointer]:
                        - text: ▸
                        - generic [ref=e76]:
                          - generic [ref=e77]: Processo
                          - strong [ref=e78]: PROC-201
                        - generic [ref=e79]: 1 documento/i
                      - list [ref=e80]:
                        - listitem [ref=e81]:
                          - generic [ref=e82]:
                            - generic [ref=e83]: "Tipo:"
                            - text: Documento
                          - strong [ref=e84]: Documento DOC-301
            - listitem [ref=e85]:
              - generic [ref=e86]:
                - generic [ref=e87]:
                  - generic [ref=e88]:
                    - generic [ref=e89]: "Tipo:"
                    - text: Classe
                  - strong [ref=e90]: Classe Delibere
                - 'generic "Stato: Valido" [ref=e92]': Valido
```

# Test source

```ts
  164 |     const aipDetailsPage = new AipDetailsPage(page);
  165 |     await aipDetailsPage.openDocumentDetailFromTree();
  166 | 
  167 |     await expect(aipDetailsPage.verificationStatusLabel).toContainText(/verificato|corrotto|sconosciuto/i);
  168 |   });
  169 | 
  170 |   test(`[TS-222] Verificare che l'utente possa avviare la conversione del report di verifica visualizzato in formato PDF`, async ({ page }) => {
  171 |     const calls = await installMockIpc(page);
  172 | 
  173 |     const aipDetailsPage = new AipDetailsPage(page);
  174 |     await aipDetailsPage.openDocumentDetailFromTree();
  175 |     await aipDetailsPage.exportButton.click();
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
> 264 |       await expect(page.getByText(/non vi siano classi corrotte/i)).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
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
  276 |       await expect(page.locator('[data-testid="integrity-report-detail"]')).toBeVisible();
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
```