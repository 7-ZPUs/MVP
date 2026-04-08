// --- ENUMERATION BASATE SULL'XSD ---
export type TipoAggregazioneEnum = 'Fascicolo' | 'Serie Documentale' | 'Serie Di Fascicoli'; // [cite: 17]
export type TipologiaFascicoloEnum =
  | 'affare'
  | 'attivita'
  | 'persona fisica'
  | 'persona giuridica'
  | 'procedimento amministrativo'; // [cite: 17, 18]

// --- INTERFACCE STRUTTURALI ---
export interface FaseDTO {
  tipoFase:
    | 'Preparatoria'
    | 'Istruttoria'
    | 'Consultiva'
    | 'Decisoria o liberativa'
    | "Integrazione dell'efficacia"; // [cite: 36]
  dataInizio: string; // Formato YYYY-MM-DD [cite: 36]
  dataFine?: string; // [cite: 36]
}

export interface AssegnazioneDTO {
  tipoAssegnazione: 'Per competenza' | 'Per conoscenza'; // [cite: 16]
  soggettoAssegnatario: SoggettoDTO;
  dataInizioAssegnazione: string; // Formato YYYY-MM-DD [cite: 16]
  dataFineAssegnazione?: string; // [cite: 16]
}

export interface IdAggDTO {
  tipoAggregazione: TipoAggregazioneEnum; // [cite: 16, 17]
  idAggregazione: string; // [cite: 16]
}

export interface ClassificazioneDTO {
  indiceDiClassificazione: string; // [cite: 34]
  descrizione: string; // [cite: 34]
  pianoDiClassificazione?: string; // [cite: 34]
}

export interface ChiaveDescrittivaDTO {
  oggetto: string; // [cite: 35]
  paroleChiave?: string; // Fino a 5 parole [cite: 35, 36]
}

export interface SoggettoDTO {
  tipoRuolo: string;
  denominazione?: string;
  codiceFiscale?: string;
  indirizzoDigitale?: string;
}

export interface ProcedimentoAmministrativoDTO {
  materiaArgomentoStruttura: string; // [cite: 36]
  procedimento: string; // [cite: 36]
  uriProcedimento: string; // [cite: 36]
  fasi: FaseDTO[]; // [cite: 36, 37]
}

export interface DocumentIndexEntryDTO {
  tipoDocumento: 'DocumentoAmministativoinformatico' | 'Documentoinformatico' | 'Documento'; // [cite: 42]
  identificativo: string; // [cite: 43]
  impronta?: string; // Base64 [cite: 43]
  routeId?: string;
}

export interface ProcessSummaryDTO {
  uuid: string;
  integrityStatus: string;
  timestamp: string;
}

export interface CustomMetadataEntry {
  nome: string;
  valore: string;
}

export interface AggregateDetailDTO {
  idAgg: IdAggDTO; // [cite: 14]
  tipologiaFascicolo?: TipologiaFascicoloEnum; // [cite: 14]
  soggetti: SoggettoDTO[]; // [cite: 14]
  assegnazione: AssegnazioneDTO;
  dataApertura: string; // Formato YYYY-MM-DD [cite: 14]
  dataChiusura?: string; // [cite: 15]
  classificazione: ClassificazioneDTO; // [cite: 15]
  progressivo: number; // Max 4999 [cite: 15, 35]
  chiaveDescrittiva: ChiaveDescrittivaDTO; // [cite: 15]
  procedimentoAmministrativo?: ProcedimentoAmministrativoDTO; // [cite: 15]
  posizioneFisicaAggregazioneDocumentale?: string; // [cite: 15]
  tempoDiConservazione?: number; // [cite: 16]
  note?: string; // [cite: 16]
  customMetadata?: CustomMetadataEntry[]; // ADDED NEW CATCH-ALL METADATA
  processSummary?: ProcessSummaryDTO;

  // Tabella laterale visiva
  indiceDocumenti: DocumentIndexEntryDTO[]; // [cite: 15]
}
