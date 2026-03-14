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

export interface ConservazioneFilter {
  valore: number | null;
  perenne: boolean | null;
}

/* UC 12.1.1 - 12.1.6 */
export interface CommonFilterValues {
  chiaveDescrittiva: ChiaveDescrittivaFilter | null;
  classificazione: ClassificazioneFilter | null;
  conservazione: string | null;
  note: string | null;
  tipo: DocumentType | null;
}

export interface AggregareFilterValues {
  tipo: string | null;
  idAggregazione: string | null;
  fascicolo: string | null;
  dataDa: string | null;
  dataA: string | null;
  procedimento: string | null;
  assegnazione: string | null;
}
