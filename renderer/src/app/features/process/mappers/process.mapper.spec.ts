import { describe, expect, it } from 'vitest';
import { mapProcessDtoToDetail } from './process.mapper';

describe('process.mapper', () => {
  it('mappa correttamente metadati ricorsivi e processo conservazione', () => {
    const detail = mapProcessDtoToDetail({
      id: 31,
      uuid: 'PROC-31',
      integrityStatus: 'VALID',
      documentClassId: 22,
      metadata: {
        name: 'Root',
        type: 'composite',
        value: [
          { name: 'Oggetto', value: 'Processo Contratti', type: 'string' },
          { name: 'Procedimento', value: 'Gestione Contratti', type: 'string' },
          { name: 'PreservationProcessUUID', value: 'PRES-31', type: 'string' },
          { name: 'Sessione', value: 'SESSION-99', type: 'string' },
          { name: 'PreservationProcessDate', value: '2026-04-08', type: 'string' },
          {
            name: 'CustomMetadata',
            type: 'composite',
            value: [{ name: 'CanaleOrigine', value: 'PEC', type: 'string' }],
          },
        ],
      },
    });

    expect(detail.processId).toBe('31');
    expect(detail.processUuid).toBe('PROC-31');
    expect(detail.integrityStatus).toBe('VALID');
    expect(detail.conservation.processo).toBe('PRES-31');
    expect(detail.conservation.sessione).toBe('SESSION-99');
    expect(detail.conservation.dataInizio).toBe('2026-04-08');
    expect(detail.documentClass.id).toBe(22);
    expect(detail.customMetadata.some((entry) => entry.nome === 'CanaleOrigine')).toBe(true);
  });

  it('usa fallback robusti con metadata array piatto', () => {
    const detail = mapProcessDtoToDetail({
      id: 7,
      uuid: '',
      integrityStatus: null,
      documentClassId: null,
      metadata: [{ name: 'Oggetto', value: 'N/D Test', type: 'string' }],
    });

    expect(detail.processId).toBe('7');
    expect(detail.processUuid).toBe('N/D');
    expect(detail.integrityStatus).toBe('UNKNOWN');
    expect(detail.overview.oggetto).toBe('N/D Test');
    expect(detail.conservation.processo).toBe('N/D');
    expect(detail.documentClass.id).toBeNull();
  });
});
