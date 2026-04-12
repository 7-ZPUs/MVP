import { describe, expect, it } from 'vitest';
import { mapDocumentsToIndexEntries, resolveDocumentLabel } from './document-index.util';

describe('document-index.util', () => {
  it('resolveDocumentLabel usa NomeDelDocumento quando presente', () => {
    const label = resolveDocumentLabel({
      id: 1,
      uuid: 'DOC-1',
      metadata: [{ name: 'NomeDelDocumento', value: 'Contratto.pdf' }],
    });

    expect(label).toBe('Contratto.pdf');
  });

  it('resolveDocumentLabel usa fallback su uuid quando metadata e vuoto', () => {
    const label = resolveDocumentLabel({
      id: 2,
      uuid: 'DOC-2',
      metadata: [],
    });

    expect(label).toBe('DOC-2');
  });

  it('mapDocumentsToIndexEntries supporta metadata wrapper', () => {
    const entries = mapDocumentsToIndexEntries([
      {
        id: 10,
        uuid: 'DOC-10',
        metadata: {
          name: 'Root',
          value: [{ name: 'Oggetto', value: 'Documento Wrapper' }],
        },
      },
    ]);

    expect(entries).toEqual([
      {
        tipoDocumento: 'Documento',
        identificativo: 'Documento Wrapper',
        routeId: '10',
      },
    ]);
  });

  it('mapDocumentsToIndexEntries ritorna array vuoto con input nullo', () => {
    expect(mapDocumentsToIndexEntries(null)).toEqual([]);
  });
});
