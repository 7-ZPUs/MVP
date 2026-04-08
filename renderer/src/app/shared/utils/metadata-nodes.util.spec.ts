import { describe, expect, it } from 'vitest';
import { normalizeMetadataNodes } from './metadata-nodes.util';

describe('normalizeMetadataNodes', () => {
  it('ritorna il contenuto metadata se e gia un array valido', () => {
    const input = [
      { name: 'Oggetto', value: 'Processo Contratti' },
      { name: 'Sessione', value: 'S-1' },
    ];

    const result = normalizeMetadataNodes(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Oggetto');
  });

  it('estrae i nodi da wrapper con proprietà value', () => {
    const input = {
      name: 'Root',
      value: [{ name: 'NomeDelDocumento', value: 'Doc.pdf' }],
    };

    const result = normalizeMetadataNodes(input);

    expect(result).toEqual([{ name: 'NomeDelDocumento', value: 'Doc.pdf' }]);
  });

  it('ritorna array vuoto con input non valido', () => {
    expect(normalizeMetadataNodes(null)).toEqual([]);
    expect(normalizeMetadataNodes(undefined)).toEqual([]);
    expect(normalizeMetadataNodes({ name: 'x', value: 'y' })).toEqual([]);
  });
});
