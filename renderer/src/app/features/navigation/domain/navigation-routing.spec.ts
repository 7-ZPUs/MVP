import { describe, expect, it } from 'vitest';
import {
  buildDetailRoute,
  isRichDetailRouteItemType,
  mapDipNodeTypeToDetailItemType,
  mapSearchResultTypeToDetailItemType,
} from './navigation-routing';

describe('navigation-routing', () => {
  it('mappa tutti i tipi nodo del tree verso un tipo detail', () => {
    expect(mapDipNodeTypeToDetailItemType('dip')).toBe('DIP');
    expect(mapDipNodeTypeToDetailItemType('documentClass')).toBe('DOCUMENT_CLASS');
    expect(mapDipNodeTypeToDetailItemType('process')).toBe('AGGREGATE');
    expect(mapDipNodeTypeToDetailItemType('document')).toBe('DOCUMENT');
    expect(mapDipNodeTypeToDetailItemType('file')).toBe('FILE');
  });

  it('normalizza i tipi risultato ricerca noti', () => {
    expect(mapSearchResultTypeToDetailItemType('AGGREGAZIONE DOCUMENTALE')).toBe('AGGREGATE');
    expect(mapSearchResultTypeToDetailItemType('documento_informatico')).toBe('DOCUMENT');
    expect(mapSearchResultTypeToDetailItemType('documento amministrativo informatico')).toBe(
      'DOCUMENT',
    );
    expect(mapSearchResultTypeToDetailItemType('tipo sconosciuto')).toBeNull();
  });

  it('riconosce i tipi rich detail', () => {
    expect(isRichDetailRouteItemType('AGGREGATE')).toBe(true);
    expect(isRichDetailRouteItemType('DOCUMENT')).toBe(true);
    expect(isRichDetailRouteItemType('DIP')).toBe(false);
  });

  it('costruisce la route detail', () => {
    expect(buildDetailRoute('DOCUMENT_CLASS', 77)).toEqual(['/detail', 'DOCUMENT_CLASS', '77']);
  });
});