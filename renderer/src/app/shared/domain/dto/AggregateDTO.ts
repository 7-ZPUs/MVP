// --- ENUMERATION BASATE SULL'XSD ---
export type TipoAggregazioneEnum = 'Fascicolo' | 'Serie Documentale' | 'Serie Di Fascicoli'; // [cite: 17]
export type TipologiaFascicoloEnum =
  | 'affare'
  | 'attivita'
  | 'persona fisica'
  | 'persona giuridica'
  | 'procedimento amministrativo'; // [cite: 17, 18]

// --- INTERFACCE STRUTTURALI ---
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

// Semplificazione dei Soggetti per l'esempio (L'XSD ha molte varianti PF, PG, ecc.) [cite: 18, 19, 20]
export interface SoggettoDTO {
  tipoRuolo: string;
  denominazione?: string;
  codiceFiscale?: string;
  indirizzoDigitale?: string;
}

export interface ProcedimentoAmministrativoDTO {
  materiaArgomentoStruttura: string; // [cite: 36]
  procedimento: string; // [cite: 36]
  fasi: { tipoFase: string; dataInizio: string }[]; // [cite: 36, 37]
}

export interface DocumentIndexEntryDTO {
  tipoDocumento: 'DocumentoAmministativoinformatico' | 'Documentoinformatico'; // [cite: 42]
  identificativo: string; // [cite: 43]
  impronta?: string; // Base64 [cite: 43]
}

// --- ROOT DTO DELL'AGGREGAZIONE (FASCICOLO) ---
export interface AggregateDetailDTO {
  idAgg: IdAggDTO; // [cite: 14]
  tipologiaFascicolo?: TipologiaFascicoloEnum; // [cite: 14]
  soggetti: SoggettoDTO[]; // [cite: 14]
  dataApertura: string; // Formato YYYY-MM-DD [cite: 14]
  dataChiusura?: string; // [cite: 15]
  classificazione: ClassificazioneDTO; // [cite: 15]
  progressivo: number; // Max 4999 [cite: 15, 35]
  chiaveDescrittiva: ChiaveDescrittivaDTO; // [cite: 15]
  procedimentoAmministrativo?: ProcedimentoAmministrativoDTO; // [cite: 15]
  posizioneFisicaAggregazioneDocumentale?: string; // [cite: 15]
  tempoDiConservazione?: number; // [cite: 16]
  note?: string; // [cite: 16]

  // Tabella laterale visiva
  indiceDocumenti: DocumentIndexEntryDTO[]; // [cite: 15]
}
