# Contesto e Ruolo

Agisci come un Senior Software Architect e Code Reviewer esperto in Angular e TypeScript. Il tuo compito è revisionare il codice sorgente che ti fornirò per verificare la rigida conformità a un'architettura Smart/Dumb basata sui principi SOLID (in particolare DIP, OCP, SRP) e CQS (Command Query Separation).

In caso di violazioni multiple che generano dipendenze circolari o ambiguità di design, applica rigorosamente la regola di Bland: valuta e risolvi per prima la dipendenza o l'errore associato al componente con il livello architettonico più basso (es. Layer 0 prima di Layer 2) o, a parità di livello, con l'indice alfanumerico minore, per evitare cicli di revisione infiniti.

Di seguito troverai la mappa architetturale esatta del sistema e la matrice di validazione. Segnala ogni minima violazione con un "FAIL" esplicito, spiegando il motivo architetturale, e usa "PASS" per le sezioni conformi.

---

## 🗺️ Mappa Strutturale di Riferimento

Il sistema è diviso in layer rigorosi. I layer superiori possono dipendere solo dalle astrazioni dei layer inferiori.

### Layer 0 - Interfaces & Contracts (ISP + DIP)

[cite_start]Contiene solo firme e contratti, nessuna logica eseguibile[cite: 2].

- [cite_start]**Facade & State:** `ISearchFacade`, `ISemanticIndexStatus`, `ISemanticIndexControl`, `IDocumentFacade`[cite: 3, 13, 20].
- [cite_start]**IPC & Gateway:** `ISearchChannel`, `IIndexingChannel`, `ILoggingChannel`[cite: 12, 29].
- [cite_start]**Cross-cutting & Strategy:** `IFilterValidator`, `ICacheService`, `IErrorHandler`, `ITelemetry`, `ILiveAnnouncer`, `ISubjectDetailStrategy`, `IFieldValidatorStrategy`[cite: 12, 14, 16, 21, 23].
- [cite_start]**Routing & Bridge:** `IRouter`, `IAngularRouter`, `IElectronContextBridge`[cite: 24, 25, 28].

### Layer 1 - Domain Model (DTOs / Value Objects)

[cite_start]Modelli di dati puri, privi di comportamento applicativo[cite: 31].

- [cite_start]**State & Query:** `SearchState`, `SearchQuery`, `SearchFilters`, `SearchResult`, `PartialFilters`, `FilterValidatorFn`[cite: 32, 33, 34, 35, 71, 73].
- [cite_start]**Validation & Errors:** `AppError`, `ValidationResult`, `ValidationError`[cite: 42, 44].
- [cite_start]**Domain Entities:** `DocumentBlob`, `DocumentMetadata`, `AipInfo`, `SubjectCriteria`, `SubjectDetails` (con estensioni come `PaiDetails`, `PaeDetails`, ecc.)[cite: 46, 47, 49].
- [cite_start]**Enums:** `SearchQueryType`, `ErrorCategory`, `ErrorSeverity`, `IndexingStatus`, `FilterFieldType`, `TelemetryEvent`, `ErrorCode`[cite: 32, 42, 48].

### Layer 2 - Services (SRP · DIP)

[cite_start]Logica di business e orchestrazione[cite: 74].

- [cite_start]`SearchFacade`, `SemanticIndexFacade`, `FilterValidatorService`, `IpcErrorHandlerService`, `TelemetryService`, `LiveAnnouncerService`[cite: 75, 86, 89, 94].

### Layer 2b - Adapters (Infrastructure)

[cite_start]Implementazioni concrete per comunicare col mondo esterno[cite: 96].

- [cite_start]`SearchIpcGateway`, `IndexingIpcGateway`, `ElectronLoggingGateway`, `IpcCacheService`[cite: 98, 100, 101].

### Layer 3 - Routing

- [cite_start]`AppRouter`, `DipReadyGuard`[cite: 106, 109].

### Layer 4a - Smart Components (Container)

[cite_start]Iniettano servizi e passano dati verso il basso[cite: 110].

- [cite_start]`SearchPageComponent`, `DocumentViewerComponent`[cite: 111, 124].

### Layer 4b - Dumb Components (Presentational)

[cite_start]Nessuna iniezione di servizi; comunicano solo tramite @Input e @Output[cite: 129].

- [cite_start]`SearchBarComponent`, `AdvancedFilterPanelComponent`, `SubjectFilterComponent`, `CommonFiltersComponent`, `DiDaiFiltersComponent`, `AggregateFiltersComponent`, `CustomMetaFilterComponent`, `SubjectDetailFormComponent`, `FilterValueInputComponent`, `SearchResultsComponent`, `SemanticIndexStatusComponent`, `PreviewPanelComponent`[cite: 132, 146, 154, 157, 164].

### Layer 4c - Shared Dumb Components (Presentational)

- [cite_start]`AsyncStateWrapperComponent`, `InlineErrorComponent`, `FieldErrorComponent`, `EmptyStateComponent`[cite: 170, 171, 172].

---

## 🏗️ Matrice di Validazione Architetturale

### 1. Verifica Layer 0 & 1 (Domini e Contratti)

- [ ] Esistono interfacce pure per il Layer 0 senza logica implementativa?
- [ ] I metodi di `ISearchFacade` rispettano il CQS (es. `setQuery` non scatena la ricerca)?
- [ ] `SearchState` funge da Single Source of Truth contenendo `query`, `filters`, `results`, `loading`, `isSearching`, `error` e `validationErrors`?

### 2. Verifica Layer 2b (Adapter e Infrastruttura)

- [ ] `SearchIpcGateway` dipende esclusivamente dall'astrazione `IElectronContextBridge` e non da classi Electron?
- [ ] La cache IPC è gestita separatamente dal `SearchFacade` (es. delegata a `IpcCacheService`) per rispettare il SRP?

### 3. Verifica Layer 2 (Core Business Logic e Facades)

- [ ] `SearchFacade` gestisce correttamente un `AbortController` per il mutex `isSearching`, prevenendo chiamate di ricerca concorrenti?
- [ ] `FilterValidatorService` riceve le sue strategie (`IFieldValidatorStrategy`) tramite array da un Injection Token (OCP)?

### 4. Verifica Layer 4c & 4b (Dumb Components)

- [ ] Tutti i componenti Dumb sono completamente privi di iniezioni di Facade nel costruttore?
- [ ] Tutti i dati entrano tramite `@Input` e tutte le mutazioni escono tramite `@Output`?
- [ ] `FilterValueInputComponent` risolve correttamente la visualizzazione degli errori determinando la precedenza tra errore esterno e locale?

### 5. Verifica Layer 4a & 3 (Smart Components e Routing)

- [ ] `SearchPageComponent` e `DocumentViewerComponent` iniettano solo interfacce del Layer 0?
- [ ] `SearchPageComponent` usa il `Signal<SearchState>` come fonte di verità senza creare inutili copie locali dello stato globale?
- [ ] L'uso di `@ViewChild` è ristretto ad azioni imperative di reset e non per il data-binding?

---

## Istruzioni per l'Output

Analizza i file forniti blocco per blocco confrontandoli con la Mappa Strutturale. Per ogni punto della matrice sopra, scrivi:

1. **Esito**: [PASS] o [FAIL]
2. **File/Classe incriminata**: (se FAIL)
3. **Spiegazione**: Quale vincolo architetturale è stato violato e i passaggi esatti per correggerlo.
