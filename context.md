### **1. ENTITÀ (core/domain/entities)**

| Entità | Descrizione | campi |
|--------|-------------|------------------------|
| **DIP** | Pacchetto di disseminazione (root) | `uuid`, `integrityStatus`|
| **DocumentClass** | Classificazione documentale | `uuid`, `nome`, `timestamp`, `integrityStatus` |
| **Process** | Processo | `uuid`, `metadata`, `integrityStatus`, `parentClass_uuid` |
| **Document** | Documento archivistico | `uuid`, `metadata`, `type`, `integrityStatus`, `parentProcess_uuid` |
| **File** | File fisico (primary/attachment) | `uuid`, `hash`, `integrityStatus`, `parentDocument_uuid` |
| **Metadata** | Metadato chiave-valore | `name`, `value`, `type` |
| **Subject** | Soggetto (persona/ente) | `type`, `metadata` |

---


### **2. USE CASES (core/application/use-cases)**

| Use Case | Input | Output | Descrizione |
|----------|-------|--------|-------------|
| **IndexDIP** | | `IndexResult` | Legge DiPIndex.xml, parsa struttura ed estrae metadati/file in DB |
| **SearchDocumentalClass** | `name` | `DocumentClass[]` | Ricerca per metadata con filtri AND |
| **SearchProcessi** | `uuid` | `Processo[]` | Ricerca per metadata con filtri AND |
| **SearchDocuments** | `filters[]` | `Documento[]` | Ricerca per metadata con filtri AND |
| **SearchSemantic** | `query: string` | `{id, score}[]` | Ricerca semantica via AI (similarità vettoriale) |
| **GetDocumentClassById** | `id: number` | `DocumentClass` | Recupera una classe documentale per ID |
| **GetProcessById** | `id: number` | `Process` | Recupera un processo per ID |
| **GetDocumentById** | `id: number` | `Document` | Recupera un documento per ID |
| **GetFileById** | `id: number` | `File` | Recupera un file per ID |
| **GetClassesByDip** | `id: number` | `File` | Recupera le classi documentali di un DiP |
| **GetProcessesByClass** | `id: number` | `Process[]` | Recupera i processi di una classe documentale |
| **GetDocumentsByProcess** | `id: number` | `Documento[]` | Recupera i documenti di un processo |
| **GetFilesByDocument** | `id: number` | `File[]` | Recupera i file di un documento |
| **CheckDIPIntegrity** | - | `IntegrityCheckResult` | Verifica integrità completa del DiP |
| **CheckDocumentClassIntegrity** | `Id` | `IntegrityCheckResult` | Verifica integrità completa della classe docuemntale |
| **CheckProcessoIntegrity** | `Id` | `IntegrityCheckResult` | Verifica integrità completa del processo |
| **CheckFileIntegrity** | `Id` | `IntegrityCheckResult` | Calcola SHA256 e confronta con hash atteso (Impronta) |
| **GetClassiDocumentaliByStatus** | `IntegrityStatus` | `DocumentClass[]` | Ritorna la lista delle classi documentali con lo status specificato |
| **GetProcessiByStatus** | `IntegrityStatus` | `Processo[]` | Ritorna la lista dei processi con lo status specificato |
| **GetDocumentiByStatus** | `IntegrityStatus` | `Documento[]` | Ritorna la lista dei documenti con lo status specificato |
| **GetFilesByStatus** | `IntegrityStatus` | `File[]` | Ritorna la lista dei file con lo status specificato |
| **OpenFile** | `Id` | void | Apre file con app di sistema o finestra Electron |
| **ExportFile** | `Id`, `targetPath` | `ExportResult` | Salva file su disco utente |
| **PrintFile** | `Id`, `targetPath` | `ExportResult` | Salva file su disco utente |


---

### **3a. PORTS (core/domain/ports)**
| Port | Metodi principali |
|------|-------------------|
| **WordEmbeddingPort** | `generateEmbedding(text: string): Promise<Vector>` |
| **PackageReaderPort** | `getClasses(): Promise<DocumentClass[]>`, `getProcesses(): Promise<Process[]>`, `getDocuments(): Promise<Document[]>`, `getFiles(): Promise<File[]>`, `readFileBytes(file_id): Promise<Buffer>`, `openReadStream(file_id): Promise<Readable>` |
| **FileExportPort** | `exportFile(destPath: string, content: Buffer): Promise<ExportResult>`, `openWriteStream(destPath: string, source: Readable): Promise<void>` |
| **PrintPort** | `printFile(buffer: Buffer): Promise<PrintResult>` |
| **PackageIndexPort** | `indexClass(): void`, `indexProcess(): void`, `indexDocument(): void`, `indexFile(): void` |
| **PackageSearchPort** | `searchClasses(string: name): Class[]`, `searchProcesses(string: uuid): Process[]`, `searchDocument(Filter[]): void`, `searchDocumentSemantic(string: query): Promise<List<Document,number>>` |
| **PackageBrowsingPort** | `getClasses(): DocumentClass[]`, `getProcessesByClass(classId: number): Promise<Process[]>`, `getDocumentsByProcess(classId: number): Promise<Document[]>`, `getFilesByDocument(documentId: number): Promise<File[]>`, `getClassById(id: number): Promise<Class>`, `getProcessById(id: number): Promise<Process>`, `getDocumentById(id: number): Promise<Document>`, `getFileById(id: number): Promise<File>`, `getDocumentClassByStatus(status: IntegrityStatus): Promise<DocumentClass[]>`, `getProcessesByStatus(status: IntegrityStatus): Promise<Process[]>`, `getDocumentsByStatus(status: IntegrityStatus): Promise<Document[]>`, `getFilesByStatus(status: IntegrityStatus): Promise<File[]>` |
<!-- | **PackageIntegrityPort** | `getDipIntegrityStatus(): IntegrityStatus`, `getClassIntegrityStatus(id: number): IntegrityStatus`, `getProcessIntegrityStatus(id: number): IntegrityStatus`, `getDocumentIntegrityStatus(id: number): IntegrityStatus`, `getFileIntegrityStatus(id: number): IntegrityStatus`,`getDocumentClassByStatus(status: IntegrityStatus): Promise<DocumentClass[]>`, `getProcessesByStatus(status: IntegrityStatus): Promise<Process[]>`, `getDocumentsByStatus(status: IntegrityStatus): Promise<Document[]>`, `getFilesByStatus(status: IntegrityStatus): Promise<File[]>` | -->

---

### **4. ADAPTER (core/infrastructure/adapters)**

| Adapter | Tipo | Implementa (Ports) | Descrizione |
|---------|------|--------------------|-------------|
| **`SqlitePackageAdapter`** | Database | `PackageIndexPort`, `PackageSearchPort`, `PackageBrowsingPort` | Unico adapter SQLite. Garantisce la consistenza centralizzando la scrittura, la lettura e il salvataggio dello stato di integrità sulle stesse tabelle relazionali. |
| **`LocalPackageReaderAdapter`** | File System | `PackageReaderPort` | Legge il pacchetto dal disco estraendo le entità specifiche e fornendo l'accesso ai byte dei file fisici. |
| **`LocalAiAdapter`** | AI / ML | `WordEmbeddingPort` | Genera vettori per la ricerca semantica usando un modello locale. |
| **`ElectronSystemAdapter`** | OS / Native | `FileExportPort`, `PrintPort` | Interagisce con le API native di sistema per il salvataggio su disco utente e le code di stampa. |

---

### **5. IPC ADAPTER (core/infrastructure/ipc)**

*Riorganizzati per funzionalità (Capabilities) verso il Renderer (Angular).*

#### A. `IndexIpcAdapter` (Importazione e Navigazione Base)
| Canale IPC | Input | Output | Descrizione / Use Case invocato |
|------------|-------|--------|---------------------------------|
| `node:index-class` | `class: DocumentClass` | `void` | Recupera classe per ID . |
| `node:index-process` | `process: ArchivalProcess` | `void` | Recupera processo per ID. |
| `node:index-document`| `document: Document` | `void` | Recupera documento per ID |
| `node:index-file`| `file: File` | `void` | Recupera documento per ID. |

#### B. `SearchIpcAdapter` (Motore di Ricerca)
| Canale IPC | Input | Output | Descrizione / Use Case invocato |
|------------|-------|--------|---------------------------------|
| `search:classes` | `name?: string` | `DocumentClass[]` | Ricerca classi con filtri. |
| `search:processes`| `uuid?: string` | `ArchivalProcess[]`| Ricerca processi con filtri. |
| `search:documents`| `filters: SearchFilter[]` | `Document[]` | Ricerca documenti con filtri. |
| `search:semantic` | `query: string` | `SearchResult[]` | Ricerca semantica vettoriale. |
| `search:ai-state` | - | `{ initialized: boolean; indexedDocuments: number }` | Stato modello AI locale. |

#### C. `IntegrityIpcAdapter` (Validazione e Hash)
| Canale IPC | Input | Output | Descrizione / Use Case invocato |
|------------|-------|--------|---------------------------------|
| `integrity:check-dip` | `id: number` | `IntegrityCheckResult` | Verifica integrità completa del DIP. |
| `integrity:check-class` | `id: number` | `IntegrityCheckResult` | Verifica integrità classe. |
| `integrity:check-process`| `id: number` | `IntegrityCheckResult` | Verifica integrità processo. |
| `integrity:check-file` | `id: number` | `IntegrityCheckResult` | Verifica hash del file. |
| `integrity:get-class-by-status`| `status: IntegrityCheckResult` | `DocumentClass[]` \| null`| Ritorna lista di classi doocumentali per stato di integrità. |
| `integrity:get-process-by-status`| `status: IntegrityCheckResult` | `Process[]` \| null`| Ritorna lista di processi per stato di integrità. |
| `integrity:get-document-by-status`| `status: IntegrityCheckResult` | `Document[]` \| null`| Ritorna lista di documenti per stato di integrità. |

#### D. `FileViewerIpcAdapter` (Sistema Operativo e I/O)
| Canale IPC | Input | Output | Descrizione / Use Case invocato |
|------------|-------|--------|---------------------------------|
| `file:get-by-id` | `id: string` | `File` | Recupera file per ID (`GetFileById`). |
| `file:open-external` | `path: string` | `{ success: boolean }` | Apre con app di sistema (`OpenFile`). |
| `file:open-in-window` | `path: string` | `{ success: boolean }` | Apre in finestra Electron (`OpenFile`). |
| `file:download` | `fileId: number, targetPath?: string`| `{ success: boolean; savedPath?: string }` | Salva file su disco (`ExportFile`). |
| `file:print` | `fileId: number, targetPath?: string`| `{ success: boolean; savedPath?: string }` | Stampa file. |

#### E. `BrowsingIpcAdapter` (Navigazione Dettagliata)
| Canale IPC | Input | Output | Descrizione / Use Case invocato |
| `browse:get-by-class` | `classId: number` | `Document[]` | File appartenenti a un documento. |
| `browse:get-by-process` | `processId: number` | `Document[]` | File appartenenti a un processo. |
| `browse:get-by-document` | `documentId: number` | `File[]` | File appartenenti a un documento. |
| `browse:get-class-by-id` | `id: number` | `DocumentClass` | Recupera classe documentale per ID. |
| `browse:get-process-by-id` | `id: number` | `Process` | Recupera processo per ID. |
| `browse:get-document-by-id` | `id: number` | `Document` | Recupera documento per ID. |
| `browse:get-file-by-id` | `id: number` | `File` | Recupera file per ID. |
