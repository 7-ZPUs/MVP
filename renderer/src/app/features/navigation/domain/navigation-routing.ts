import { DipTreeNode } from '../contracts/dip-tree-node';

export type DetailRouteItemType = 'DOCUMENT' | 'AGGREGATE';

const SEARCH_RESULT_TYPE_TO_DETAIL_ITEM_TYPE: Record<string, DetailRouteItemType> = {
  AGGREGAZIONE_DOCUMENTALE: 'AGGREGATE',
  DOCUMENTO_INFORMATICO: 'DOCUMENT',
  DOCUMENTO_AMMINISTRATIVO_INFORMATICO: 'DOCUMENT',
};

function normalizeSearchResultType(type: string): string {
  return type.trim().replace(/\s+/g, '_').toUpperCase();
}

export function mapDipNodeTypeToDetailItemType(
  nodeType: DipTreeNode['type'],
): DetailRouteItemType | null {
  switch (nodeType) {
    case 'document':
      return 'DOCUMENT';
    case 'process':
      return 'AGGREGATE';
    default:
      return null;
  }
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