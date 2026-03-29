import { describe, it, expect, beforeEach } from 'vitest';
import { SearchRangeValidationStrategy } from './search-range-validation.strategy';
import { PartialSearchFilters } from '../../../../../../shared/metadata';

describe('SearchRangeValidationStrategy', () => {
  let strategy: SearchRangeValidationStrategy;

  beforeEach(() => {
    strategy = new SearchRangeValidationStrategy();
  });

  describe('Assenza di campi scatenanti (Uscite anticipate)', () => {
    it('NON dovrebbe eseguire validazioni se manca completamente il blocco common', () => {
      const filters = {} as PartialSearchFilters;
      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it('NON dovrebbe segnalare errore se è presente solo la dataDa o solo la dataA', () => {
      const filters = {
        common: { dataDa: '2026-01-01', dataA: null },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it('NON dovrebbe segnalare errore se è presente solo il minimo o solo il massimo numerico', () => {
      const filters = {
        common: { numeroAllegatiMin: 5, numeroAllegatiMax: null },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });
  });

  describe('Contraddizioni di Range Temporali', () => {
    it('dovrebbe segnalare errore se dataDa è successiva a dataA', () => {
      const filters = {
        common: {
          dataDa: '2026-12-31',
          dataA: '2026-01-01',
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('common.dataDa')).toBe(true);
      expect(result.get('common.dataDa')?.[0].code).toBe('ERR_RANGE_001');
    });

    it('NON dovrebbe segnalare errore se dataDa è precedente o uguale a dataA', () => {
      const filters1 = {
        common: { dataDa: '2026-01-01', dataA: '2026-12-31' },
      } as unknown as PartialSearchFilters;
      const filters2 = {
        common: { dataDa: '2026-05-15', dataA: '2026-05-15' },
      } as unknown as PartialSearchFilters;

      expect(strategy.validate(filters1).size).toBe(0);
      expect(strategy.validate(filters2).size).toBe(0);
    });
  });

  describe('Contraddizioni di Range Numerici', () => {
    it('dovrebbe segnalare errore se il minimo è maggiore del massimo', () => {
      const filters = {
        common: {
          numeroAllegatiMin: 10,
          numeroAllegatiMax: 5,
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('common.numeroAllegatiMin')).toBe(true);
      expect(result.get('common.numeroAllegatiMin')?.[0].code).toBe('ERR_RANGE_002');
    });

    it('NON dovrebbe segnalare errore se il minimo è minore o uguale al massimo', () => {
      const filters1 = {
        common: { numeroAllegatiMin: 0, numeroAllegatiMax: 5 },
      } as unknown as PartialSearchFilters;
      const filters2 = {
        common: { numeroAllegatiMin: 3, numeroAllegatiMax: 3 },
      } as unknown as PartialSearchFilters;

      expect(strategy.validate(filters1).size).toBe(0);
      expect(strategy.validate(filters2).size).toBe(0);
    });
  });
});
