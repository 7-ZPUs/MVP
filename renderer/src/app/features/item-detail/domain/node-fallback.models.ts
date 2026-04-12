import { AppError } from '../../../shared/domain';
import {
  NodeFallbackRouteItemType,
  RichDetailRouteItemType,
} from '../../navigation/domain/navigation-routing';

export type NodeFallbackItemType = NodeFallbackRouteItemType;

export interface NodeFallbackField {
  label: string;
  value: string;
}

export interface NodeFallbackRelatedItem {
  itemType: RichDetailRouteItemType;
  itemId: string;
  label: string;
  description?: string;
}

export interface NodeFallbackRelatedSection {
  title: string;
  emptyMessage: string;
  items: NodeFallbackRelatedItem[];
}

export interface NodeFallbackDetail {
  type: NodeFallbackItemType;
  typeLabel: string;
  title: string;
  subtitle: string;
  fields: NodeFallbackField[];
  relatedSection?: NodeFallbackRelatedSection;
  hint?: string;
}

export interface NodeFallbackState {
  detail: NodeFallbackDetail | null;
  loading: boolean;
  error: AppError | null;
}