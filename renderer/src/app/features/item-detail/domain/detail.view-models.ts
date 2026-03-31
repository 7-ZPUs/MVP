import { AggregateDetailDTO } from '../../../shared/domain/dto/AggregateDTO';
import { DocumentDetail } from '../../document/domain/document.models';

export type ItemDetailType = 'AGGREGATE' | 'DOCUMENT';

// Definiamo i due stati possibili della nostra UI
export interface AggregateItemVM {
  type: 'AGGREGATE';
  data: AggregateDetailDTO;
}

export interface DocumentItemVM {
  type: 'DOCUMENT';
  data: DocumentDetail;
}

// L'unione che useremo nella vista
export type ItemDetailVM = AggregateItemVM | DocumentItemVM;
