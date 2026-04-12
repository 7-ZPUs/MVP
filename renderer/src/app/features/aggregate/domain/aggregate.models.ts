import { AppError } from '../../../shared/domain';
import { AggregateDetailDTO } from '../../../shared/domain/dto/AggregateDTO';

/*export interface ProcedurePhase {
  tipoFase: string;
  dataInizio: string;
  dataFine?: string;
}

export interface AdminProcedureData {
  indice: string;
  denominazione: string;
  uri: string;
  fasi: ProcedurePhase[];
}

export interface DocumentIndexEntry {
  tipo: string;
  identificativo: string;
}

export interface AggregateMetadata {
  tipo: string;
  id: string;
  tipologiaFascicolo: string;
  assegnazione: string;
  dateApertura: string;
  dataChiusura?: string;
  progressivo: string;
  posizioneFisica: string;
  idPrimaria: string;
  conservazione: string;
}

export interface AggregateDetail {
  aggregateId: string;
  metadata: AggregateMetadata;
  adminProcedure?: AdminProcedureData; // Opzionale come da XSD e C4
  documentIndex: DocumentIndexEntry[];
}
*/

export interface AggregateState {
  detail: AggregateDetailDTO | null;
  loading: boolean;
  error: AppError | null;
}
