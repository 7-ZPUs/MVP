import { describe, it, expect, beforeEach } from 'vitest';
import { AggregationContradictionStrategy } from './aggregation-contradiction.strategy';
import { PartialSearchFilters } from '../../../../../../shared/domain/metadata';
import { AggregationType, FascicoloType } from '../../../../../../shared/domain/metadata/search.enum';

describe('AggregationContradictionStrategy', () => {
  let strategy: AggregationContradictionStrategy;

  beforeEach(() => {
    strategy = new AggregationContradictionStrategy();
  });

  describe('Casi di Successo (Nessuna Contraddizione)', () => {
    it('dovrebbe passare se non ci sono filtri aggregate', () => {
      const filters = {} as PartialSearchFilters;
      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it("dovrebbe passare se l'utente non specifica il tipo ma compila i campi (ricerca broad)", () => {
      const filters = {
        aggregate: {
          procedimento: { materia: 'Ambiente' },
          assegnazione: { tipoAssegnazione: 'COMPETENZA' },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it('dovrebbe passare con una combinazione valida completa', () => {
      const filters = {
        aggregate: {
          tipoAggregazione: AggregationType.FASCICOLO,
          tipoFascicolo: FascicoloType.PROCEDIMENTO,
          procedimento: { materia: 'Edilizia' },
          assegnazione: { tipoAssegnazione: 'COMPETENZA' },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });
  });

  describe('Casi di Fallimento (Contraddizioni Logiche)', () => {
    it('dovrebbe fallire se Tipo Aggregazione NON è Fascicolo ma viene specificata una Tipologia Fascicolo', () => {
      const filters = {
        aggregate: {
          tipoAggregazione: AggregationType.SERIE_DOCUMENTALE,
          tipoFascicolo: FascicoloType.PERSONA_FISICA,
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(1);

      const errors = result.get('aggregate.tipoFascicolo');
      expect(errors).toBeDefined();
      expect(errors?.[0].code).toBe('AGG_CNTR_001');
    });

    it('dovrebbe fallire se Tipo Fascicolo NON è Procedimento ma vengono compilati i dati del Procedimento', () => {
      const filters = {
        aggregate: {
          tipoFascicolo: FascicoloType.PERSONA_FISICA,
          procedimento: { materia: 'Ambiente' },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(1);

      const errors = result.get('aggregate.procedimento');
      expect(errors).toBeDefined();
      expect(errors?.[0].code).toBe('AGG_CNTR_002');
    });

    it("dovrebbe fallire se Tipo Aggregazione NON è Fascicolo ma viene compilata l'Assegnazione", () => {
      const filters = {
        aggregate: {
          tipoAggregazione: AggregationType.SERIE_DOCUMENTALE,
          assegnazione: { dataInizioAssegn: '2026-03-26' },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(1);

      const errors = result.get('aggregate.assegnazione');
      expect(errors).toBeDefined();
      expect(errors?.[0].code).toBe('AGG_CNTR_003');
    });

    it('dovrebbe accumulare errori multipli se ci sono più contraddizioni contemporaneamente', () => {
      const filters = {
        aggregate: {
          tipoAggregazione: AggregationType.SERIE_DOCUMENTALE,
          tipoFascicolo: FascicoloType.PERSONA_FISICA, // Errore 1
          assegnazione: { tipoAssegnazione: 'COMPETENZA' }, // Errore 2
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(2);
      expect(result.has('aggregate.tipoFascicolo')).toBe(true);
      expect(result.has('aggregate.assegnazione')).toBe(true);
    });
  });
});
