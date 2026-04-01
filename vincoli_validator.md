Ecco i vincoli strutturali, logici e di formato che un sistema di validazione deve controllare durante l'inserimento dei metadati, suddivisi per categoria.

### 1. Vincoli di Formato e Pattern (Espressioni Regolari e Limiti)

Il sistema deve validare la correttezza formale di specifici campi testuali e numerici:

- [cite_start]**Codice Fiscale (`CFType`)**: Deve rispettare esattamente il pattern `[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]`[cite: 458, 462, 841, 1120].
- [cite_start]**Partita IVA (`PIType`)**: Deve essere composta esattamente da 11 cifre (`\d{11}`)[cite: 466, 841, 1120].
- [cite_start]**Numero Protocollo (`NumProtType`)**: Deve essere una stringa numerica di almeno 7 cifre (`[0-9]{7,}`)[cite: 253, 663].
- [cite_start]**Codice Registro (`CodiceRegistroType`)**: Deve avere una lunghezza compresa tra 1 e 16 caratteri e contenere solo alfanumerici, underscore, punto o trattino (`[A-Za-z0-9_\.\-]{1,16}`)[cite: 258, 663].
- [cite_start]**Numero Allegati (`NumeroAllegatiType`)**: Deve essere un numero intero compreso tra 0 e 9999[cite: 135, 377, 379, 380, 569, 780, 781].
- [cite_start]**Tempo di Conservazione (`TempoDiConservazioneType`)**: Deve essere espresso in anni con un numero intero tra 1 e 9999[cite: 471, 472, 846, 847, 1121]. [cite_start]Il valore 9999 indica la conservazione "Permanente"[cite: 192, 193, 626, 627, 972, 974].
- [cite_start]**Progressivo**: Deve essere un numero intero compreso tra 1 e 999999999[cite: 1064, 1065].
- [cite_start]**Parole Chiave**: Se inserite, possono avere un massimo di 5 occorrenze per ogni chiave descrittiva[cite: 124, 367, 560, 769, 931, 1071].
- [cite_start]**Algoritmo Impronta**: Il valore di default è `SHA-256`[cite: 55, 213, 489, 649, 1118].

### 2. Vincoli di Dominio (Vocabolari Controllati)

Campi che accettano solo valori specifici predefiniti:

- [cite_start]**Tipologia di Flusso**: Ammette solo i valori "U" (Uscita), "E" (Entrata) o "I" (Interno)[cite: 90, 230, 231, 232, 520].
- [cite_start]**Tipo Registro**: Ammette solo "Nessuno", "Protocollo Ordinario/Protocollo Emergenza", o "Repertorio/Registro"[cite: 90, 239, 240, 241, 520, 660].
- [cite_start]**Modalità di Formazione**: Ammette 4 specifiche definizioni testuali corrispondenti alle casistiche a, b, c, d delle Linee Guida[cite: 65, 217, 218, 499, 651, 652, 653, 654].
- [cite_start]**Tipo Modifica**: "Annullamento", "Rettifica", "Integrazione", "Annotazione"[cite: 186, 450, 451, 452, 453, 620, 841].
- [cite_start]**Tipo Aggregazione**: "Fascicolo", "Serie Documentale", "Serie Di Fascicoli"[cite: 860, 991, 992, 993].
- [cite_start]**Tipologia Fascicolo**: "affare", "attivita", "persona fisica", "persona giuridica", "procedimento amministrativo"[cite: 874, 998, 999, 1000, 1001, 1002].
- [cite_start]**Tipo Fase (Procedimento Amministrativo)**: "Preparatoria", "Istruttoria", "Consultiva", "Decisoria o deliberativa", "Integrazione dell'efficacia"[cite: 954, 1085].

### 3. Vincoli di Obbligatorietà Condizionata (Dipendenze Logiche)

La validazione deve controllare che alcuni campi siano presenti solo al verificarsi di specifiche condizioni:

- **Segnatura e Registro**:
  - [cite_start]Il campo `Codice Registro` è obbligatorio solo se `Tipo registro` è impostato su Protocollo ordinario/emergenza o Repertorio/Registro[cite: 89, 92].
  - [cite_start]La `Segnatura` è obbligatoria nel caso di un documento amministrativo informatico protocollato[cite: 488, 489].
- **Verifica (Firme e Conformità)**:
  - [cite_start]I check `Firmato Digitalmente`, `Sigillato Elettronicamente` e `Marcatura Temporale` sono obbligatori se la Modalità di Formazione del documento è "a" oppure "b"[cite: 167, 601].
  - [cite_start]Il check `Conformità copie immagine su supporto informatico` è obbligatorio solo se la Modalità di Formazione è "b"[cite: 167, 601].
- [cite_start]**Allegati**: Se il metadato `Numero allegati` è maggiore di 0, diventa obbligatorio compilare sia l'`IdDoc` (identificativo) sia la `Descrizione` per ciascun allegato dichiarato[cite: 129, 135, 565, 569].
- [cite_start]**Tracciatura Modifiche**: Le sezioni "Tipo modifica", "Soggetto autore", e "Data/Ora" sono obbligatorie se si indica un annullamento o se la versione del documento è superiore a 1.0[cite: 186, 620]. [cite_start]L'identificativo del documento versione precedente (`IdDoc versione precedente`) è parimenti obbligatorio in questi casi[cite: 186, 620].
- **Aggregazioni Documentali (Fascicoli)**:
  - [cite_start]Il metadato `Tipologia fascicolo` è applicabile (e obbligatorio) esclusivamente se `TipoAggregazione` è "Fascicolo"[cite: 874].
  - [cite_start]Il metadato complesso `Procedimento Amministrativo` (inclusi "Materia", "Denominazione", "Tipo Fase" e "Data inizio fase") è obbligatorio solo nel caso in cui la `Tipologia fascicolo` sia valorizzata come "procedimento amministrativo"[cite: 952, 954].
  - [cite_start]Il metadato `Assegnazione` è obbligatorio nel caso di un "Fascicolo"[cite: 912].
  - [cite_start]Il `Tempo di conservazione` dell'aggregazione diviene obbligatorio nel momento in cui si valorizza la `Data di chiusura`[cite: 973, 974].
  - [cite_start]La `Posizione fisica` è obbligatoria solo in caso di fascicoli ibridi o fascicoli cartacei digitalizzati[cite: 964].

### 4. Vincoli sui Soggetti e Ruoli

Esistono rigide regole gerarchiche su chi può essere assegnato a un documento o aggregazione:

- [cite_start]**Univocità della Registrazione**: Deve essere **sempre** presente un Soggetto/Amministrazione con ruolo "Soggetto che effettua la registrazione" per rendere univoci i dati[cite: 102, 108, 533, 541].
- **Autore/Mittente**: È obbligatorio indicare almeno l'Autore o il Mittente. [cite_start]Se il documento è protocollato, l'indicazione del Mittente è obbligatoria[cite: 103, 108, 534, 541].
- [cite_start]**Ruolo "Operatore"**: Obbligatorio se viene compilata la sezione `Tracciature modifiche documento`[cite: 104, 108, 535, 541].
- **Tipizzazione (Tipo Soggetto)**:
  - [cite_start]Il ruolo "Assegnatario" richiede sempre un tipo `AS`[cite: 110, 543].
  - [cite_start]Il ruolo "Registrazione" accetta solo `PF` (Persona Fisica), `PG` (Organizzazione) o `PAI` (PA Italiana)[cite: 110, 543].
  - [cite_start]Il ruolo "Produttore" accetta unicamente il tipo `SW` (Sistema Software)[cite: 106, 113, 539, 546].
  - [cite_start]Nel documento amministrativo informatico, l'Assegnatario prevede l'indicazione sia della persona fisica che della UOR[cite: 536, 541].
  - Se viene definito il ruolo "RUP" (Responsabile Unico del Procedimento), le informazioni su `PF` (Persona Fisica) e `UOR` di appartenenza sono strettamente obbligatorie. [cite_start]Inoltre, il RUP è indicabile solo per `TipoAggregazione = 'Fascicolo'`[cite: 537, 541, 543, 888, 891, 892].
