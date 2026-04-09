import { AppError } from '../../../shared/domain';

export enum MimeType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  XML = 'XML',
  UNSUPPORTED = 'UNSUPPORTED',
}

export enum SubjectType {
  PF = 'PERSONA_FISICA',
  PG = 'PERSONA_GIURIDICA',
  AS = 'ASSEGNATARIO',
  PAI = 'AMMINISTRAZIONI_PUBBLICHE_ITALIANE',
  PAE = 'AMMINISTRAZIONI_PUBBLICHE_ESTERE',
  SW = 'SOFTWARE',
}

export interface DocumentMetadata {
  nome: string;
  descrizione: string;
  oggetto: string;
  paroleChiave?: string[];
  dataCreazione?: string;
  lingua?: string;
  note?: string;
  tipoDocumentale: string;
  modalitaFormazione: string;
  riservatezza: string;
  versione: string;
  conservazioneEreditata?: string;
  tempoDiConservazione?: string;
  idIdentificativoDocumentoPrimario?: string;
  identificativo: string;
  impronta: string;
  algoritmoImpronta: string;
}

export interface RegistrationData {
  flusso: string;
  tipoRegistro: string;
  data: string;
  ora?: string;
  numero: string;
  codice: string;
}

export interface DocumentDetail {
  documentId: string;
  fileName: string;
  mimeType: MimeType;
  metadata: DocumentMetadata;
  registration: RegistrationData;
  classification: ClassificationInfo;
  format: FormatInfo;
  verification: VerificationInfo;
  subjects?: Subject[];
  attachments: AttachmentData;
  changeTracking: ChangeTrackingData;
  customMetadata?: CustomMetadataEntry[];
  aipInfo: AipInfo;
  aggregation?: AggregationInfo;
  documentiCollegati?: string[];
  integrityStatus?: string;
}

export interface AggregationInfo {
  tipoAggregazione?: string;
  idAggregazione?: string;
}

export interface ClassificationInfo {
  indice: string;
  descrizione: string;
  uriPiano: string;
}

export interface FormatInfo {
  tipo: string;
  prodotto: string;
  versione: string;
  produttore: string;
}

export interface VerificationInfo {
  firmaDigitale: string;
  sigillo: string;
  marcaturaTemporale: string;
  conformitaCopie: string;
}

export interface Subject {
  ruolo: string;
  tipo: SubjectType;
  campiSpecifici: Record<string, string>;
}

export interface AttachmentEntry {
  id: string;
  descrizione: string;
}

export interface AttachmentData {
  numero: number;
  allegati?: AttachmentEntry[];
}

export interface ChangeTrackingData {
  tipo: string;
  soggetto: string;
  data: string;
  ora?: string;
  idVersionePrecedente: string;
}

export interface CustomMetadataEntry {
  nome: string;
  valore: string;
}

export interface AipInfo {
  classeDocumentale: string;
  uuid: string;
}

export interface DocumentState {
  detail: DocumentDetail | null;
  loading: boolean;
  error: AppError | null;
}
