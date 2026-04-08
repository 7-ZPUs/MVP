import { DipTreeNode } from '../contracts/dip-tree-node';

export type RichDetailRouteItemType = 'DOCUMENT' | 'AGGREGATE' | 'PROCESS';
export type NodeFallbackRouteItemType = 'DIP' | 'DOCUMENT_CLASS' | 'FILE';
export type DetailRouteItemType = RichDetailRouteItemType | NodeFallbackRouteItemType;

const SEARCH_RESULT_TYPE_TO_DETAIL_ITEM_TYPE: Record<string, DetailRouteItemType> = {
  AGGREGAZIONE_DOCUMENTALE: 'AGGREGATE',
  DOCUMENTO_INFORMATICO: 'DOCUMENT',
  DOCUMENTO_AMMINISTRATIVO_INFORMATICO: 'DOCUMENT',
  PROCESSO: 'PROCESS',
  CLASSE: 'DOCUMENT_CLASS',
};

function normalizeSearchResultType(type: string): string {
  return type.trim().replaceAll(/\s+/g, '_').toUpperCase();
}

export function mapDipNodeTypeToDetailItemType(
  nodeType: DipTreeNode['type'],
): DetailRouteItemType {
  switch (nodeType) {
    case 'dip':
      return 'DIP';
    case 'documentClass':
      return 'DOCUMENT_CLASS';
    case 'file':
      return 'FILE';
    case 'document':
      return 'DOCUMENT';
    case 'process':
      return 'PROCESS';
  }
}

export function isRichDetailRouteItemType(
  itemType: DetailRouteItemType,
): itemType is RichDetailRouteItemType {
  return itemType === 'AGGREGATE' || itemType === 'DOCUMENT' || itemType === 'PROCESS';
}

export function mapSearchResultTypeToDetailItemType(resultType: string): DetailRouteItemType | null {
  const normalizedType = normalizeSearchResultType(resultType);
  return SEARCH_RESULT_TYPE_TO_DETAIL_ITEM_TYPE[normalizedType] ?? null;
}

export function buildDetailRoute(
  itemType: DetailRouteItemType,
  itemId: string | number,
): [string, DetailRouteItemType, string] {
  return ['/detail', itemType, String(itemId)];
}