import { describe, expect, it } from 'vitest';
import { mapProcessDtoToDetail } from './process.mapper';

describe('process.mapper', () => {
  it('mappa correttamente sessioni di versamento e conservazione da metadati annidati', () => {
    const detail = mapProcessDtoToDetail({
      id: 31,
      uuid: 'PROC-31',
      integrityStatus: 'VALID',
      documentClassId: 22,
      metadata: {
        name: 'AiPInfo',
        type: 'composite',
        value: [
          {
            name: 'Process',
            type: 'composite',
            value: [
              {
                name: '$',
                type: 'composite',
                value: [{ name: 'uuid', value: 'PROC-XML-UUID', type: 'string' }],
              },
              {
                name: 'End',
                type: 'composite',
                value: [{ name: 'Status', value: 'CHIUSO', type: 'string' }],
              },
              { name: 'Oggetto', value: 'Processo Contratti', type: 'string' },
              { name: 'Procedimento', value: 'Gestione Contratti', type: 'string' },
              {
                name: 'SubmissionSession',
                type: 'composite',
                value: [
                  {
                    name: '$',
                    type: 'composite',
                    value: [{ name: 'uuid', value: 'SUB-SESSION-01', type: 'string' }],
                  },
                  {
                    name: 'Start',
                    type: 'composite',
                    value: [
                      { name: 'Date', value: '2025-12-11T16:48:48.087Z', type: 'string' },
                      { name: 'UserUUID', value: 'USR-001', type: 'string' },
                      { name: 'Source', value: 'WebGui', type: 'string' },
                    ],
                  },
                  {
                    name: 'End',
                    type: 'composite',
                    value: [
                      { name: 'Date', value: '2025-12-11T16:50:39.671Z', type: 'string' },
                      { name: 'UserUUID', value: 'USR-001', type: 'string' },
                      { name: 'Source', value: 'WebGui', type: 'string' },
                      { name: 'Status', value: 'TERMINATA', type: 'string' },
                    ],
                  },
                ],
              },
              {
                name: 'PreservationSession',
                type: 'composite',
                value: [
                  {
                    name: '$',
                    type: 'composite',
                    value: [{ name: 'uuid', value: 'PRES-SESSION-01', type: 'string' }],
                  },
                  {
                    name: 'Start',
                    type: 'composite',
                    value: [
                      { name: 'Date', value: '2025-12-11T16:50:39.671Z', type: 'string' },
                      { name: 'UserUUID', value: 'USR-001', type: 'string' },
                      { name: 'Source', value: 'Other', type: 'string' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(detail.processId).toBe('31');
    expect(detail.processUuid).toBe('PROC-31');
    expect(detail.integrityStatus).toBe('VALID');
    expect(detail.metadata.processId).toBe('31');
    expect(detail.metadata.processUuid).toBe('PROC-31');
    expect(detail.submission.processo).toBe('PROC-XML-UUID');
    expect(detail.submission.sessione).toBe('SUB-SESSION-01');
    expect(detail.submission.dataInizio).toBe('2025-12-11T16:48:48.087Z');
    expect(detail.submission.dataFine).toBe('2025-12-11T16:50:39.671Z');
    expect(detail.submission.uuidAttivatore).toBe('USR-001');
    expect(detail.submission.uuidTerminatore).toBe('USR-001');
    expect(detail.submission.canaleAttivazione).toBe('WebGui');
    expect(detail.submission.canaleTerminazione).toBe('WebGui');
    expect(detail.submission.stato).toBe('TERMINATA');
    expect(detail.conservation.processo).toBe('PROC-XML-UUID');
    expect(detail.conservation.sessione).toBe('PRES-SESSION-01');
    expect(detail.conservation.dataInizio).toBe('2025-12-11T16:50:39.671Z');
    expect(detail.conservation.dataFine).toBeUndefined();
    expect(detail.conservation.uuidAttivatore).toBe('USR-001');
    expect(detail.conservation.canaleAttivazione).toBe('Other');
    expect(detail.conservation.stato).toBeUndefined();
    expect(detail.metadata.processStatus).toBe('CHIUSO');
    expect(detail.documentClass.id).toBe(22);
    expect(detail.metadata.documentClassName).toBe('N/A');
  });

  it('mantiene fallback legacy per metadata piatti di conservazione', () => {
    const detail = mapProcessDtoToDetail({
      id: 31,
      uuid: 'PROC-31',
      integrityStatus: 'VALID',
      documentClassId: 22,
      metadata: [
        { name: 'PreservationProcessUUID', value: 'PRES-31', type: 'string' },
        { name: 'Sessione', value: 'SESSION-99', type: 'string' },
        { name: 'PreservationProcessDate', value: '2026-04-08', type: 'string' },
        { name: 'PreservationProcessEnd', value: '2026-04-09', type: 'string' },
        { name: 'SessioneVersamento.UUIDAttivatore', value: 'USR-ATT-VERS-001', type: 'string' },
        { name: 'SessioneVersamento.CanaleAttivazione', value: 'PortaleWeb', type: 'string' },
        { name: 'SessioneVersamento.Stato', value: 'TERMINATA', type: 'string' },
        {
          name: 'SessioneConservazione.UUIDAttivatore',
          value: 'USR-ATT-CONS-001',
          type: 'string',
        },
        {
          name: 'SessioneConservazione.CanaleAttivazione',
          value: 'ConservazioneBatch',
          type: 'string',
        },
        { name: 'SessioneConservazione.Stato', value: 'TERMINATA', type: 'string' },
        { name: 'StatoProcesso', value: 'COMPLETATO', type: 'string' },
        { name: 'DataApertura', value: '2026-04-01', type: 'string' },
      ],
    });

    expect(detail.submission.processo).toBe('PRES-31');
    expect(detail.submission.sessione).toBe('SESSION-99');
    expect(detail.submission.dataInizio).toBe('2026-04-01');
    expect(detail.submission.dataFine).toBeUndefined();
    expect(detail.submission.uuidAttivatore).toBe('USR-ATT-VERS-001');
    expect(detail.submission.canaleAttivazione).toBe('PortaleWeb');
    expect(detail.submission.stato).toBe('TERMINATA');
    expect(detail.conservation.processo).toBe('PRES-31');
    expect(detail.conservation.sessione).toBe('SESSION-99');
    expect(detail.conservation.dataInizio).toBe('2026-04-08');
    expect(detail.conservation.dataFine).toBe('2026-04-09');
    expect(detail.conservation.uuidAttivatore).toBe('USR-ATT-CONS-001');
    expect(detail.conservation.canaleAttivazione).toBe('ConservazioneBatch');
    expect(detail.conservation.stato).toBe('TERMINATA');
    expect(detail.metadata.processStatus).toBe('COMPLETATO');
  });

  it('usa fallback robusti con metadata minimali', () => {
    const detail = mapProcessDtoToDetail({
      id: 7,
      uuid: '',
      integrityStatus: null,
      documentClassId: null,
      metadata: [{ name: 'Oggetto', value: 'N/D Test', type: 'string' }],
    });

    expect(detail.processId).toBe('7');
    expect(detail.processUuid).toBe('N/A');
    expect(detail.integrityStatus).toBe('UNKNOWN');
    expect(detail.overview.oggetto).toBe('N/D Test');
    expect(detail.conservation.processo).toBe('N/A');
    expect(detail.submission.processo).toBe('N/A');
    expect(detail.submission.dataInizio).toBe('N/A');
    expect(detail.documentClass.id).toBeNull();
    expect(detail.documentClass.name).toBe('N/A');
    expect(detail.metadata.documentClassUuid).toBe('N/A');
  });
});
