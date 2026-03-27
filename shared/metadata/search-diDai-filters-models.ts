import {
  IsoDateString,
  IsoTimestampString,
} from "../../renderer/src/app/shared/domain/shared-types";
import {
  AGIDFormats,
  DIDAIFormation,
  FlowType,
  RegisterType,
  ModificationType,
} from "./search.enum";

// UC-12.2.1.2.1 - UC-12.2.1.2.5
export interface RegistrazioneFilter {
  tipologiaFlusso: FlowType | null;
  tipologiaRegistro: RegisterType | null;
  dataRegistrazione: IsoDateString | null;
  oraRegistrazione: IsoTimestampString | null;
  numeroRegistrazione: number | null;
  codiceRegistro: string | null;
}

// UC-12.2.1.6.1 - UC-12.2.1.6.4
export interface IdentificativoFormatoFilter {
  formato: AGIDFormats | null;
  nomeProdottoCreazione: string | null;
  versioneProdottoCreazione: string | null;
  produttoreProdottoCreazione: string | null;
}

// UC-12.2.1.7.1 - UC-12.2.1.7.4
export interface DatiVerificaFilter {
  formatoDigitalmente: boolean | null;
  sigillatoElettr: boolean | null;
  marcaturaTemporale: boolean | null;
  conformitaCopie: boolean | null;
}

// UC-12.2.1.11.1 - UC-12.2.1.11.3
export interface ModificaFilter {
  tipoModifica: ModificationType | null;
  dataModifica: IsoDateString | null;
  oraModifica: IsoTimestampString | null;
  idVersionePrec: string | null;
}

// UC-12.2.1.2 - UC-12.2.1.5
export interface DiDaiFilterValues {
  registrazione: RegistrazioneFilter | null;
  tipologia: string | null;
  modalitaFormazione: DIDAIFormation | null;
  riservatezza: boolean | null;
  identificativoFormato: IdentificativoFormatoFilter | null;
  verifica: DatiVerificaFilter | null;
  nome: string | null;
  versione: string | null;
  idPrimario: string | null;
  tracciatureModifiche: ModificaFilter[] | null;
}
