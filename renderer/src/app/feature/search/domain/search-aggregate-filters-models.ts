import { IsoDateString } from '../../../shared/domain/shared-types';
import { SoggettoFilter } from './search-subject-filters-models';
import {
  AggregationType,
  FascicoloType,
  ProcedimentoFaseType,
  AssegnazioneType,
} from './search.enum';

// UC-12.2.2.8.1 - UC-12.2.2.8.4
export interface ProcedimentoFilter {
  materia: string | null;
  denominazioneProcedimento: string | null;
  URICatalogo: string | null;
  fasi: FaseProcedimentoFilter[] | null;
}

// UC-12.2.2.8.4.1 - UC-12.2.2.8.4
export interface FaseProcedimentoFilter {
  tipoFase: ProcedimentoFaseType | null;
  dataInizioFase: IsoDateString | null;
  dataFineFase: IsoDateString | null;
}

// UC-12.2.2.9.1.1 - UC-12.2.2.9.1.3 , UC-13
export interface AssegnazioneFilter {
  tipoAssegnazione: AssegnazioneType | null;
  soggettoAssegn: SoggettoFilter | null;
  dataInizioAssegn: IsoDateString | null;
  dataFineAssegn: IsoDateString | null;
}

// UC-12.2.2.1 - UC-12.2.2.10
export interface AggregareFilterValues {
  tipoAggregazione: AggregationType | null;
  idAggregazione: string | null;
  tipoFascicolo: FascicoloType | null;
  dataApertura: IsoDateString | null;
  dataChiusura: IsoDateString | null;
  procedimento: ProcedimentoFilter | null;
  assegnazione: AssegnazioneFilter | null;
}
