import { describe, it, expect, beforeEach } from 'vitest';
import { SearchRangeValidationStrategy } from './search-range-validation.strategy';
import { PartialSearchFilters } from '../../../../../../shared/domain/metadata';

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

    it('dovrebbe segnalare errore se dataApertura è successiva a dataChiusura', () => {
      const filters = {
        aggregate: {
          dataApertura: '2026-12-31',
          dataChiusura: '2026-01-01',
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('aggregate.dataApertura')).toBe(true);
      expect(result.get('aggregate.dataApertura')?.[0].code).toBe('ERR_RANGE_001');
    });

    it('NON dovrebbe segnalare errore se dataApertura è precedente o uguale a dataChiusura', () => {
      const filters1 = {
        aggregate: { dataApertura: '2026-01-01', dataChiusura: '2026-12-31' },
      } as unknown as PartialSearchFilters;
      const filters2 = {
        aggregate: { dataApertura: '2026-05-15', dataChiusura: '2026-05-15' },
      } as unknown as PartialSearchFilters;

      expect(strategy.validate(filters1).size).toBe(0);
      expect(strategy.validate(filters2).size).toBe(0);
    });

    it('dovrebbe segnalare errore se dataInizioAssegn è successiva a dataFineAssegn', () => {
      const filters = {
        aggregate: {
          assegnazione: {
            dataInizioAssegn: '2026-12-31',
            dataFineAssegn: '2026-01-01',
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('aggregate.assegnazione.dataInizioAssegn')).toBe(true);
      expect(result.get('aggregate.assegnazione.dataInizioAssegn')?.[0].code).toBe('ERR_RANGE_001');
    });

    it('NON dovrebbe segnalare errore se dataInizioAssegn è precedente o uguale a dataFineAssegn', () => {
      const filters1 = {
        aggregate: {
          assegnazione: {
            dataInizioAssegn: '2026-01-01',
            dataFineAssegn: '2026-12-31',
          },
        },
      } as unknown as PartialSearchFilters;
      const filters2 = {
        aggregate: {
          assegnazione: {
            dataInizioAssegn: '2026-05-15',
            dataFineAssegn: '2026-05-15',
          },
        },
      } as unknown as PartialSearchFilters;

      expect(strategy.validate(filters1).size).toBe(0);
      expect(strategy.validate(filters2).size).toBe(0);
    });

    it('dovrebbe segnalare errore se dataInizioFase è successiva a dataFineFase', () => {
      const filters = {
        aggregate: {
          procedimento: {
            fasi: [
              {
                dataInizioFase: '2026-12-31',
                dataFineFase: '2026-01-01',
              },
            ],
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('aggregate.procedimento.fasi.0.dataInizioFase')).toBe(true);
      expect(result.get('aggregate.procedimento.fasi.0.dataInizioFase')?.[0].code).toBe(
        'ERR_RANGE_001',
      );
    });

    it('NON dovrebbe segnalare errore se dataInizioFase è precedente o uguale a dataFineFase', () => {
      const filters1 = {
        aggregate: {
          procedimento: {
            fasi: [
              {
                dataInizioFase: '2026-01-01',
                dataFineFase: '2026-12-31',
              },
            ],
          },
        },
      } as unknown as PartialSearchFilters;
      const filters2 = {
        aggregate: {
          procedimento: {
            fasi: [
              {
                dataInizioFase: '2026-05-15',
                dataFineFase: '2026-05-15',
              },
            ],
          },
        },
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
