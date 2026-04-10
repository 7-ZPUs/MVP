import { describe, it, expect, beforeEach } from 'vitest';
import { FormationModeContradictionStrategy } from './formation-mode-contradiction.strategy';
import { PartialSearchFilters } from '../../../../../../shared/domain/metadata';
import { DIDAIFormation } from '../../../../../../shared/domain/metadata/search.enum';

describe('FormationModeContradictionStrategy', () => {
  let strategy: FormationModeContradictionStrategy;

  beforeEach(() => {
    strategy = new FormationModeContradictionStrategy();
  });

  describe('Assenza di campi scatenanti (Uscite anticipate)', () => {
    it('NON dovrebbe segnalare errore se manca completamente il blocco diDai', () => {
      const filters = {} as PartialSearchFilters;
      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it("NON dovrebbe segnalare errore se c'è la modalità ma conformitaCopie è null/undefined", () => {
      const filters = {
        diDai: {
          modalitaFormazione: DIDAIFormation.EX_NOVO,
          verifica: { conformitaCopie: null },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it("NON dovrebbe segnalare errore se c'è conformitaCopie ma manca la modalità", () => {
      const filters = {
        diDai: {
          modalitaFormazione: null,
          verifica: { conformitaCopie: true },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });
  });

  describe('Contraddizioni Logiche', () => {
    it('dovrebbe segnalare errore se cerco modalità EX_NOVO e imposto conformitaCopie a true', () => {
      const filters = {
        diDai: {
          modalitaFormazione: DIDAIFormation.EX_NOVO,
          verifica: { conformitaCopie: true },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('diDai.verifica.conformitaCopie')).toBe(true);
      expect(result.get('diDai.verifica.conformitaCopie')?.[0].code).toBe('ERR_CONF_FORM_001');
    });

    it('dovrebbe segnalare errore se cerco modalità MEMORIZZAZIONE e imposto conformitaCopie a false', () => {
      const filters = {
        diDai: {
          modalitaFormazione: DIDAIFormation.MEMORIZZAZIONE,
          verifica: { conformitaCopie: false },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('diDai.verifica.conformitaCopie')).toBe(true);
    });
  });

  describe('Ricerche Valide', () => {
    it('NON dovrebbe segnalare errore se cerco modalità ACQUISIZIONE e imposto conformitaCopie a true', () => {
      const filters = {
        diDai: {
          modalitaFormazione: DIDAIFormation.ACQUISIZIONE,
          verifica: { conformitaCopie: true },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it('NON dovrebbe segnalare errore se cerco modalità legacy "b" e imposto conformitaCopie a true', () => {
      const filters = {
        diDai: {
          modalitaFormazione: 'b' as DIDAIFormation,
          verifica: { conformitaCopie: true },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it('NON dovrebbe segnalare errore se cerco modalità "B" (maiuscolo) e imposto conformitaCopie', () => {
      const filters = {
        diDai: {
          modalitaFormazione: 'B' as DIDAIFormation,
          verifica: { conformitaCopie: false },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });
  });
});
