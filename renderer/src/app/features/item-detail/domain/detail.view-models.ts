import { AggregateDetailDTO } from '../../../shared/domain/dto/AggregateDTO';
import { DocumentDetail } from '../../document/domain/document.models';
import { NodeFallbackDetail } from './node-fallback.models';

export type ItemDetailType = 'AGGREGATE' | 'DOCUMENT' | 'DIP' | 'DOCUMENT_CLASS' | 'FILE';

// Definiamo i due stati possibili della nostra UI
export interface AggregateItemVM {
  type: 'AGGREGATE';
  data: AggregateDetailDTO;
}

export interface DocumentItemVM {
  type: 'DOCUMENT';
  data: DocumentDetail;
}

export interface NodeFallbackItemVM {
  type: 'DIP' | 'DOCUMENT_CLASS' | 'FILE';
  data: NodeFallbackDetail;
}

// L'unione che useremo nella vista
export type ItemDetailVM = AggregateItemVM | DocumentItemVM | NodeFallbackItemVM;
