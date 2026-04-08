import { describe, expect, it } from 'vitest';
import { simplifyCustomMetadataLabel } from './custom-metadata-label.util';

describe('simplifyCustomMetadataLabel', () => {
  it('mantiene il segmento finale significativo', () => {
    expect(
      simplifyCustomMetadataLabel('Process.PreservationSession.DocumentsStats.DocumentsFilesCount'),
    ).toBe('DocumentsFilesCount');
  });

  it('mantiene due segmenti se il finale e generico', () => {
    expect(simplifyCustomMetadataLabel('Process.End.Date')).toBe('End.Date');
  });

  it('rimuove prefissi rumorosi e gestisce valori semplici', () => {
    expect(simplifyCustomMetadataLabel('Root.CustomMetadata.Process.Status')).toBe('Status');
    expect(simplifyCustomMetadataLabel('DocumentsFilesCount')).toBe('DocumentsFilesCount');
  });
});
