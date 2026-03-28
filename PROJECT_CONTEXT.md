# DIP Reader - Contesto e Obiettivi del Progetto

> Documento di contesto per il team di sviluppo MVP

---

## Cos'è un DIP?

Un **DIP (Dissemination Information Package)** è un pacchetto informativo standardizzato utilizzato nella conservazione digitale secondo il modello **OAIS (Open Archival Information System - ISO 14721)**.

Nel ciclo di vita archivistico OAIS esistono tre tipi di pacchetti:

| Pacchetto | Descrizione |
|-----------|-------------|
| **SIP** (Submission Information Package) | Pacchetto inviato dal produttore al sistema di conservazione |
| **AIP** (Archival Information Package) | Pacchetto conservato a lungo termine nell'archivio |
| **DIP** (Dissemination Information Package) | Pacchetto estratto dall'archivio per la consultazione da parte degli utenti |

Il **DIP** è quindi il formato con cui i documenti conservati vengono **resi disponibili agli utenti finali** per consultazione, verifica e utilizzo.

---

## Contesto Normativo Italiano

In Italia, la conservazione digitale è regolata da:

- **CAD (Codice dell'Amministrazione Digitale)** - D.Lgs. 82/2005
- **Linee Guida AgID** sulla formazione, gestione e conservazione dei documenti informatici
- **Regolamento eIDAS** (UE 910/2014) per firme elettroniche e sigilli

Le Pubbliche Amministrazioni e i soggetti privati che gestiscono documenti con valore legale devono garantire:
- **Integrità** dei documenti (hash crittografici)
- **Autenticità** (firme digitali, marche temporali)
- **Reperibilità** (metadati strutturati, indici di ricerca)
- **Leggibilità nel tempo** (formati standard, representation information)

---

## Obiettivo del Progetto

**DIP Reader** è un'applicazione desktop che permette di:

1. **Importare e indicizzare** pacchetti DIP esportati da sistemi di conservazione
2. **Navigare** la struttura gerarchica dei documenti (Classe documentale → AIP → Documento → File)
3. **Consultare** i metadati associati a ciascun documento e file
4. **Ricercare** documenti tramite filtri sui metadati o ricerca semantica (AI)
5. **Verificare l'integrità** dei file confrontando l'hash calcolato con quello dichiarato nei metadati
6. **Aprire e scaricare** i file originali per la consultazione

L'applicazione è pensata per:
- **Responsabili della conservazione** che devono verificare i pacchetti ricevuti
- **Utenti autorizzati** che necessitano di consultare documenti archiviati
- **Auditor** che devono controllare l'integrità e la completezza degli archivi

---

## Struttura di un DIP

Un tipico pacchetto DIP ha questa struttura:

```
DIP-{UUID}/
├── DiPIndex.{date}.{uuid}.xml      # Indice principale del pacchetto
├── {AIP-UUID-1}/                   # Primo AIP contenuto
│   ├── {anno}/
│   │   └── {documento}/
│   │       ├── documento.pdf       # File principale
│   │       ├── allegato1.pdf       # Allegati
│   │       └── metadata.xml        # Metadati del documento
│   └── ...
├── {AIP-UUID-2}/                   # Altri AIP
│   └── ...
└── RepresentationInformation/      # Informazioni di rappresentazione
    └── {uuid}/
        └── formato.xml             # Specifiche dei formati
```

### DiPIndex.xml

L'indice principale contiene:
- **DocumentClass**: classificazione archivistica dei documenti
- **AiP**: riferimenti agli Archival Information Package inclusi
- **Document**: elenco documenti con percorsi ai file e metadati
- **Files**: file primari e allegati con riferimenti agli hash

### Metadata.xml (per documento)

Ogni documento ha un file XML di metadati che include:
- **ChiaveDescrittiva**: descrizione testuale del documento
- **IndiceDiClassificazione**: titolario/classificazione
- **DatiDiRegistrazione**: protocollo, data, numero
- **Soggetti**: mittente, destinatario, firmatari
- **Impronta**: hash crittografico (SHA-256 in Base64)
- **ProceduraAmministrativa**: procedimento di riferimento
- **Fasi**: fasi del procedimento con date

---

## Funzionalità dell'Applicazione

### 1. Importazione DIP

L'utente seleziona una cartella contenente un DIP. L'applicazione:

1. Legge il file `DiPIndex.xml`
2. Estrae la struttura gerarchica (Classi → AIP → Documenti → File)
3. Parsa i metadati XML di ciascun documento
4. Salva tutto in un database SQLite locale
5. Genera embedding vettoriali per la ricerca semantica

Ogni DIP importato crea un database separato, permettendo di gestire più archivi.

### 2. Navigazione ad Albero

L'interfaccia mostra una struttura ad albero navigabile:

```
📁 Fatture Passive
  └── 📁 AiP: 6dcb564b-5a05-4a07-93fb-9c1698a7cdbf
      └── 📁 Document: ./2025/12345
          ├── 📄 fattura.pdf
          └── 📄 allegato.pdf
```

Cliccando su un nodo:
- **Cartella documento**: mostra i metadati del documento
- **File**: mostra i metadati specifici del file (incluso hash)

### 3. Visualizzazione Metadati

Pannello laterale che mostra i metadati in formato tabellare:

| Campo | Valore |
|-------|--------|
| ChiaveDescrittiva | Fattura n. 123 del 15/01/2025 |
| TipologiaDocumentale | Fattura |
| CategoriaProdotto | Spese Hardware |
| DataRegistrazioneDocumento | 2025-01-16 |
| Impronta | YWJjZGVmZ2hpamtsbW5v... |
| Algoritmo | SHA-256 |

### 4. Ricerca per Metadati

Sistema di filtri multipli con logica AND:

- Selezione campo da dropdown raggruppato per categoria
- Inserimento valore da cercare (match parziale case-insensitive)
- Possibilità di aggiungere più filtri
- Risultati mostrati come albero filtrato

**Esempio**: trovare tutte le fatture del 2025 con importo > 1000€
- Filtro 1: `TipologiaDocumentale` contiene `Fattura`
- Filtro 2: `Anno` contiene `2025`

### 5. Ricerca Semantica (AI)

Ricerca basata sul **significato** invece che su keyword esatte:

1. L'utente inserisce una descrizione in linguaggio naturale
   > "Spese mediche rimborsabili"
   
2. Il sistema genera un vettore embedding (384 dimensioni) usando un modello multilingue

3. Confronta il vettore con quelli dei documenti indicizzati (similarità coseno)

4. Restituisce i documenti più simili con punteggio di rilevanza

**Modello utilizzato**: `paraphrase-multilingual-MiniLM-L12-v2`
- Supporta italiano e altre lingue europee
- Esecuzione locale (nessun dato inviato a server esterni)
- Ottimizzato per CPU con ONNX Runtime

### 6. Verifica Integrità

Per ogni file è possibile verificare che non sia stato alterato:

1. L'utente clicca "Verifica integrità"
2. Il sistema legge il file e calcola l'hash SHA-256
3. Converte l'hash in Base64
4. Confronta con l'hash dichiarato nei metadati (`Impronta`)
5. Mostra esito: ✓ Valido / ✗ Non valido

Lo stato di verifica viene salvato nel database con data/ora.

### 7. Apertura e Download File

- **Apri**: avvia il file con l'applicazione di sistema predefinita (es. PDF Reader)
- **Scarica**: salva il file in una posizione scelta dall'utente

---

## Flusso Utente Tipico

```
┌─────────────────────────────────────────────────────────────┐
│  1. IMPORTAZIONE                                            │
│     Utente seleziona cartella DIP → Sistema indicizza       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. NAVIGAZIONE                                             │
│     Utente esplora albero → Seleziona documento/file        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CONSULTAZIONE                                           │
│     Visualizza metadati → Verifica integrità (opzionale)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. RICERCA (alternativo)                                   │
│     Filtri metadati / Query semantica → Risultati filtrati  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. AZIONE                                                  │
│     Apri file / Scarica file / Esporta database             │
└─────────────────────────────────────────────────────────────┘
```

---

## Requisiti Non Funzionali

### Sicurezza
- **Esecuzione locale**: nessun dato trasmesso a server esterni
- **Isolamento**: ogni DIP ha il proprio database
- **Integrità verificabile**: hash crittografici per ogni file

### Performance
- Indicizzazione di DIP con migliaia di documenti in pochi secondi
- Ricerca istantanea su database SQLite indicizzato
- Ricerca semantica con latenza < 500ms per query

### Usabilità
- Interfaccia intuitiva con navigazione ad albero
- Filtri componibili senza conoscere SQL
- Feedback visivo su stati (caricamento, successo, errore)

### Portabilità
- Applicazione desktop cross-platform (Windows, macOS, Linux)
- Nessuna dipendenza da servizi cloud
- Database SQLite portabile

---

## Glossario

| Termine | Definizione |
|---------|-------------|
| **AIP** | Archival Information Package - pacchetto conservato nell'archivio |
| **DIP** | Dissemination Information Package - pacchetto per la consultazione |
| **Embedding** | Rappresentazione vettoriale di un testo per ricerca semantica |
| **Hash** | Impronta digitale di un file (es. SHA-256) |
| **Impronta** | Campo metadati contenente l'hash del file in Base64 |
| **OAIS** | Open Archival Information System - standard ISO 14721 |
| **SIP** | Submission Information Package - pacchetto di versamento |
| **Titolario** | Sistema di classificazione archivistica |

---

## Riferimenti

- [OAIS Reference Model (ISO 14721)](https://www.iso.org/standard/57284.html)
- [Linee Guida AgID sulla conservazione](https://www.agid.gov.it/it/agenzia/stampa-e-comunicazione/notizie/2021/09/10/pubblicate-linee-guida-formazione-gestione-conservazione-documenti-informatici)
- [CAD - Codice dell'Amministrazione Digitale](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-03-07;82)
