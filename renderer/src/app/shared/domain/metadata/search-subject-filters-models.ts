import { SubjectRoleType, SubjectType } from './search.enum';

// UC-13.3.1: UC-13.3.1.1 - UC-13.3.1.4
export interface PAIDetails {
  denominazione: string | null;
  codiceIPA: string | null;
  denominazioneAOO: string | null;
  codiceIPAAOO: string | null;
  denominazioneUOR: string | null;
  codiceIPAUOR: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.2: UC-13.3.2.1 - UC-13.3.2.2 , UC-13.3.1.4
export interface PAEDetails {
  denominazioneAmm: string | null;
  denominazioneUfficio: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.3: UC-13.3.3.1 - UC-13.3.3.3
export interface ASDetails {
  nomeAssegnatario: string | null;
  cognomeAssegnatario: string | null;
  codiceFiscaleAssegnatario: string | null;
  partitaIvaAssegnatario: string | null;
  denominazioneOrga: string | null;
  denominazioneUfficio: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.4: UC-13.3.4.1 , UC-13.3.3.3 , UC-13.3.2.2 , UC-13.3.1.4
export interface PGDetails {
  denominazioneOrga: string | null;
  codiceFiscalePG: string | null;
  partitaIvaPG: string | null;
  denominazioneUfficio: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.5: UC-13.3.3.1 , UC-13.3.3.2 , UC-13.3.1.4
export interface PFDetails {
  cognomePF: string | null;
  nomePF: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.6: UC  UC-13.3.3.1 - UC-13.3.3.3, UC-13.3.1.2 , UC-13.3.1.4
export interface RUPDetails {
  cognomeRUP: string | null;
  nomeRUP: string | null;
  codiceFiscaleRUP: string | null;
  denominazione: string | null;
  codiceIPA: string | null;
  denominazioneAOO: string | null;
  codiceIPAAOO: string | null;
  denominazioneUOR: string | null;
  codiceIPAUOR: string | null;
}

// UC-13.3.7: UC-13.3.7.1
export interface SWDetails {
  denominazioneSistema: string | null;
}

export type SubjectCriteria =
  | { role: SubjectRoleType; type: SubjectType.PAI; details: PAIDetails }
  | { role: SubjectRoleType; type: SubjectType.PAE; details: PAEDetails }
  | { role: SubjectRoleType; type: SubjectType.AS; details: ASDetails }
  | { role: SubjectRoleType; type: SubjectType.PG; details: PGDetails }
  | { role: SubjectRoleType; type: SubjectType.PF; details: PFDetails }
  | { role: SubjectRoleType; type: SubjectType.RUP; details: RUPDetails }
  | { role: SubjectRoleType; type: SubjectType.SW; details: SWDetails };
