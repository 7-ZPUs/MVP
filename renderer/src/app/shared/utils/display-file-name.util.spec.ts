import { describe, expect, it } from 'vitest';
import { normalizeDisplayFileName } from './display-file-name.util';

describe('normalizeDisplayFileName', () => {
  it('estrae il nome file da un path con UUID', () => {
    expect(normalizeDisplayFileName('/869e1069-e50d-48e6-8191-1c677f3053a2/Allegato_1.pdf')).toBe(
      'Allegato_1.pdf',
    );
  });

  it('rimuove il prefisso ./', () => {
    expect(normalizeDisplayFileName('./Allegato_1.pdf')).toBe('Allegato_1.pdf');
  });

  it('gestisce path windows', () => {
    expect(normalizeDisplayFileName('folder\\sub\\FilePrincipale.pdf')).toBe('FilePrincipale.pdf');
  });

  it('lascia invariato un nome gia semplice', () => {
    expect(normalizeDisplayFileName('documento.pdf')).toBe('documento.pdf');
  });

  it('ritorna stringa vuota se il valore e vuoto', () => {
    expect(normalizeDisplayFileName('   ')).toBe('');
  });
});
