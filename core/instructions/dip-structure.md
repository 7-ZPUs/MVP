# Contesto del Progetto: DIPReader - Parser XML

## Obiettivo
Il tuo compito è generare il codice TypeScript per un parser XML all'interno del progetto "DIPReader". Il sistema deve leggere e decodificare i file XML presenti in un Pacchetto di Distribuzione (DIP) generato da un sistema di conservazione digitale, estraendone le informazioni strutturate.

## Stack Tecnologico
- **Runtime:** Node.js
- **Linguaggio:** TypeScript (Strict mode abilitato)
- **Architettura:** Architettura Esagonale (Ports and Adapters)
- **Libreria suggerita per parsing XML:** `fast-xml-parser` (o `xml2js`, preferisci soluzioni performanti e type-safe).

## Riferimento Strutturale (File XSD)
I seguenti schemi XSD ti vengono forniti esclusivamente per farti capire come sono strutturati i file XML in ingresso. Il parser dovrà mappare queste strutture in interfacce e tipi TypeScript:
1. `DiPIndex.xsd`: Indice del pacchetto di distribuzione (contiene `ComplianceStatement`, `PackageInfo`, `PackageContent`, ecc.).
2. `AiPInfo.xsd`: Informazioni sul pacchetto di archiviazione (Process, Start, End).
3. `DocumentoInformatico.xsd` e `DocumentoAmministrativoInformatico.xsd`: Metadati del documento (IdDoc, Oggetto, Soggetti, Allegati).
4. `AggregazioniDocumentaliInformatiche.xsd`: Metadati delle aggregazioni (Fascicoli).
5. `DocumentMetadata.xsd`: Wrapper per i metadati dei documenti.

---

## Istruzioni per la Generazione del Codice

*Nota bene: Organizza i file applicando logicamente i principi dell'Architettura Esagonale (separazione netta tra Core Domain, Application Ports/Use Cases e Infrastructure Adapters).*

### Step 1: Modelli di Dominio (Domain Entities)
Per iniziare, genera le interfacce TypeScript corrispondenti alla struttura definita in `DiPIndex.xsd`.
- Usa i tipi primitivi corretti (`Date` per date, `boolean` per booleani).
- Mappa le sequenze come array dove l'XSD indica `maxOccurs="unbounded"`.
- Esempio di output atteso per `DiPIndex`: un'interfaccia radice contenente le sotto-strutture per `ComplianceStatement`, `PackageInfo`, e `PackageContent`.

### Step 2: Porte (Application Ports)
Definisci un'interfaccia TypeScript `IXmlParserPort` per l'ingresso/uscita dei dati.
Questa interfaccia deve esporre metodi generici per il parsing dei file XML nei modelli di dominio, mascherando l'implementazione tecnica.
Esempio:
```typescript
export interface IXmlParserPort {
  parseDiPIndex(xmlContent: string): Promise<DiPIndex>;
  // ... altri metodi per i vari XSD man mano che procediamo
}