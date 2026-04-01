import { describe, it, expect, beforeEach } from 'vitest';
import { DateTimeCoherenceValidationStrategy } from './date-time-coherence-validation.strategy';
import { PartialSearchFilters } from '../../../../../../shared/metadata';

describe('DateTimeCoherenceValidationStrategy', () => {
  let strategy: DateTimeCoherenceValidationStrategy;

  beforeEach(() => {
    strategy = new DateTimeCoherenceValidationStrategy();
  });

  it('dovrebbe segnalare errore se oraRegistrazione è valorizzata ma dataRegistrazione è assente', () => {
    const filters = {
      diDai: {
        registrazione: {
          dataRegistrazione: null,
          oraRegistrazione: '10:30',
        },
      },
    } as unknown as PartialSearchFilters;

    const result = strategy.validate(filters);

    expect(result.has('diDai.registrazione.dataRegistrazione')).toBe(true);
    expect(result.get('diDai.registrazione.dataRegistrazione')?.[0].code).toBe('ERR_CONF_DT_001');
  });

  it('dovrebbe segnalare errore se oraModifica è valorizzata ma dataModifica è assente', () => {
    const filters = {
      diDai: {
        tracciatureModifiche: [
          {
            dataModifica: null,
            oraModifica: '11:00',
          },
        ],
      },
    } as unknown as PartialSearchFilters;

    const result = strategy.validate(filters);

    expect(result.has('diDai.tracciatureModifiche.0.dataModifica')).toBe(true);
    expect(result.get('diDai.tracciatureModifiche.0.dataModifica')?.[0].code).toBe(
      'ERR_CONF_DT_002',
    );
  });

  it('NON dovrebbe segnalare errori quando data e ora sono coerenti', () => {
    const filters = {
      diDai: {
        registrazione: {
          dataRegistrazione: '2026-01-15',
          oraRegistrazione: '10:30',
        },
        tracciatureModifiche: [
          {
            dataModifica: '2026-01-16',
            oraModifica: '11:00',
          },
        ],
      },
    } as unknown as PartialSearchFilters;

    const result = strategy.validate(filters);

    expect(result.size).toBe(0);
  });
});
