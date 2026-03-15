import { DocumentType } from './search.enum';

// UC 12.1.2.1, UC 12.1.2.2
export interface ChiaveDescrittivaFilter {
  oggetto: string | null;
  paroleChiave: string | null;
}

// UC 12.1.3.1, UC 12.1.3.2
export interface ClassificazioneFilter {
  codice: string | null;
  descrizione: string | null;
}

// UC 12.1.4.1, UC 12.1.4.2
export interface ConservazioneFilter {
  valore: number | null;
  perenne: boolean | null; // Salvato come 9999 per indicare "perenne"
}

/* UC 12.1.1 - 12.1.6 */
export interface CommonFilterValues {
  chiaveDescrittiva: ChiaveDescrittivaFilter | null;
  classificazione: ClassificazioneFilter | null;
  conservazione: ConservazioneFilter | null;
  note: string | null;
  tipoDocumento: DocumentType | null;
}
