import { FilterFieldType, SubjectRoleType, SubjectType } from "./search.enum";

export interface SubjectDetails {}

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
export interface PAEDetails extends SubjectDetails {
  denominazioneAmm: string | null;
  denominazioneUfficio: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.3: UC-13.3.3.1 - UC-13.3.3.3
export interface ASDetails extends SubjectDetails {
  nomeAssegnatario: string | null;
  cognomeAssegnatario: string | null;
  codiceFiscaleAssegnatario: string | null;
  partitaIvaAssegnatario: string | null;
  denominazioneOrga: string | null;
  denominazioneUfficio: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.4: UC-13.3.4.1 , UC-13.3.3.3 , UC-13.3.2.2 , UC-13.3.1.4
export interface PGDetails extends SubjectDetails {
  denominazioneOrga: string | null;
  codiceFiscalePartitaIvaPG: string | null;
  denominazioneUfficio: string | null;
  indirizziDigitali: string[] | null;
  // Legacy keys kept optional for backward compatibility with previously stored UI state.
  codiceFiscalePG?: string | null;
  partitaIvaPG?: string | null;
}

// UC-13.3.5: UC-13.3.3.1 , UC-13.3.3.2 , UC-13.3.1.4
export interface PFDetails extends SubjectDetails {
  cognomePF: string | null;
  nomePF: string | null;
  indirizziDigitali: string[] | null;
}

// UC-13.3.6: UC  UC-13.3.3.1 - UC-13.3.3.3, UC-13.3.1.2 , UC-13.3.1.4
export interface RUPDetails extends SubjectDetails {
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
export interface SWDetails extends SubjectDetails {
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

export interface SubjectFieldDefinition {
  key: string;
  label: string;
  type: FilterFieldType;
  required: boolean;
  options?: { label: string; value: any }[]; // Solo per ENUM
}

export interface ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[];
}

const text = (
  key: string,
  label: string,
  required = false,
): SubjectFieldDefinition => ({
  key,
  label,
  type: FilterFieldType.TEXT,
  required,
});

export class PAIStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [
      text("denominazione", "Denominazione"),
      text("codiceIPA", "Codice IPA"),
      text("denominazioneAOO", "Denominazione AOO"),
      text("codiceIPAAOO", "Codice IPA AOO"),
      text("denominazioneUOR", "Denominazione UOR"),
      text("codiceIPAUOR", "Codice IPA UOR"),
      text("indirizziDigitali", "Indirizzi Digitali (separati da virgola)"),
    ];
  }
}

export class PAEStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [
      text("denominazioneAmm", "Denominazione Amministrazione"),
      text("denominazioneUfficio", "Denominazione Ufficio"),
      text("indirizziDigitali", "Indirizzi Digitali (separati da virgola)"),
    ];
  }
}

export class ASStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [
      text("nomeAssegnatario", "Nome Assegnatario"),
      text("cognomeAssegnatario", "Cognome Assegnatario"),
      text("codiceFiscaleAssegnatario", "Codice Fiscale"),
      text("partitaIvaAssegnatario", "Partita IVA"),
      text("denominazioneOrga", "Denominazione Organizzazione"),
      text("denominazioneUfficio", "Denominazione Ufficio"),
      text("indirizziDigitali", "Indirizzi Digitali (separati da virgola)"),
    ];
  }
}

export class PGStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [
      text("denominazioneOrga", "Denominazione Organizzazione"),
      text("codiceFiscalePartitaIvaPG", "Codice Fiscale / Partita IVA"),
      text("denominazioneUfficio", "Denominazione Ufficio"),
      text("indirizziDigitali", "Indirizzi Digitali (separati da virgola)"),
    ];
  }
}

export class PFStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [
      text("cognomePF", "Cognome", true),
      text("nomePF", "Nome", true),
      text("indirizziDigitali", "Indirizzi Digitali (separati da virgola)"),
    ];
  }
}

export class RUPStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [
      text("cognomeRUP", "Cognome RUP"),
      text("nomeRUP", "Nome RUP"),
      text("codiceFiscaleRUP", "Codice Fiscale RUP"),
      text("denominazione", "Denominazione Amministrazione"),
      text("codiceIPA", "Codice IPA"),
      text("denominazioneAOO", "Denominazione AOO"),
      text("codiceIPAAOO", "Codice IPA AOO"),
      text("denominazioneUOR", "Denominazione UOR"),
      text("codiceIPAUOR", "Codice IPA UOR"),
    ];
  }
}

export class SWStrategy implements ISubjectDetailStrategy {
  getFields(): SubjectFieldDefinition[] {
    return [text("denominazioneSistema", "Denominazione Sistema")];
  }
}

export const SUBJECT_STRATEGY_REGISTRY: Record<string, ISubjectDetailStrategy> =
  {
    [SubjectType.PAI]: new PAIStrategy(),
    [SubjectType.PAE]: new PAEStrategy(),
    [SubjectType.AS]: new ASStrategy(),
    [SubjectType.PG]: new PGStrategy(),
    [SubjectType.PF]: new PFStrategy(),
    [SubjectType.RUP]: new RUPStrategy(),
    [SubjectType.SW]: new SWStrategy(),
  };
