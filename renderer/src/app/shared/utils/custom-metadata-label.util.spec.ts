import { describe, expect, it } from 'vitest';
import { simplifyCustomMetadataLabel, toSpacedMetadataLabel } from './custom-metadata-label.util';

describe('simplifyCustomMetadataLabel', () => {
  it('mantiene il segmento finale significativo', () => {
    expect(
      simplifyCustomMetadataLabel('Process.PreservationSession.DocumentsStats.DocumentsFilesCount'),
    ).toBe('Documents Files Count');
  });

  it('mantiene due segmenti se il finale e generico', () => {
    expect(simplifyCustomMetadataLabel('Process.End.Date')).toBe('End Date');
  });

  it('rimuove prefissi rumorosi e gestisce valori semplici', () => {
    expect(simplifyCustomMetadataLabel('Root.CustomMetadata.Process.Status')).toBe('Status');
    expect(simplifyCustomMetadataLabel('DocumentsFilesCount')).toBe('Documents Files Count');
  });
});

describe('toSpacedMetadataLabel', () => {
  it('aggiunge spazi a camelCase, PascalCase e underscore', () => {
    expect(toSpacedMetadataLabel('SoggettoAutoreDellaModifica')).toBe(
      'Soggetto Autore Della Modifica',
    );
    expect(toSpacedMetadataLabel('CodiceFiscale_PartitaIva')).toBe(
      'Codice Fiscale Partita Iva',
    );
  });
});
