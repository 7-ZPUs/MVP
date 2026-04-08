import { AppError } from '../../../shared/domain';
import { DocumentIndexEntryDTO } from '../../../shared/domain/dto/AggregateDTO';

export interface ProcessConservationData {
  processo: string;
  sessione: string;
  dataInizio: string;
  dataFine?: string;
  uuidTerminatore?: string;
  canaleTerminazione?: string;
}

export interface ProcessOverviewData {
  oggetto: string;
  procedimento: string;
  materiaArgomentoStruttura: string;
}

export interface ProcessDocumentClassInfo {
  id: number | null;
  name?: string;
  uuid?: string;
  timestamp?: string;
}

export interface ProcessCustomMetadataEntry {
  nome: string;
  valore: string;
}

export interface ProcessDetail {
  processId: string;
  processUuid: string;
  integrityStatus: string;
  overview: ProcessOverviewData;
  conservation: ProcessConservationData;
  documentClass: ProcessDocumentClassInfo;
  customMetadata: ProcessCustomMetadataEntry[];
  indiceDocumenti: DocumentIndexEntryDTO[];
}

export interface ProcessState {
  detail: ProcessDetail | null;
  loading: boolean;
  error: AppError | null;
}
