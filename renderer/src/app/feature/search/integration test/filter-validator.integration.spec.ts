import { describe, it, expect, beforeEach } from 'vitest';
import { FilterValidatorService } from '../../validation/services/filter-validator.service';
import {
  RegistryContradictionValidationStrategy,
  FormationModeContradictionStrategy,
  SearchRangeValidationStrategy,
} from '../../validation/strategies';

// Modelli ed Enum
import { PartialSearchFilters } from '../../../../../../shared/metadata';
import { RegisterType, DIDAIFormation } from '../../../../../../shared/metadata/search.enum';

describe('FilterValidatorService - Integration Test', () => {
  let validatorService: FilterValidatorService;

  beforeEach(() => {
    validatorService = new FilterValidatorService();

    validatorService.registerStrategy(new RegistryContradictionValidationStrategy());
    validatorService.registerStrategy(new FormationModeContradictionStrategy());
    validatorService.registerStrategy(new SearchRangeValidationStrategy());
  });

  it('dovrebbe validare con successo un filtro complesso ma coerente (Happy Path)', () => {
    const validFilters = {
      common: {
        dataDa: '2026-01-01',
        dataA: '2026-12-31',
        numeroAllegatiMin: 1,
        numeroAllegatiMax: 5,
      },
      diDai: {
        registrazione: {
          tipologiaRegistro: RegisterType.PROTOCOLLO,
          codiceRegistro: 'REG-123',
        },
        modalitaFormazione: 'b' as DIDAIFormation,
        verifica: {
          conformitaCopie: true,
        },
      },
      aggregate: {
        tipoAggregazione: 'Fascicolo',
        tipologiaFascicolo: 'procedimento amministrativo',
        procedimentoAmministrativo: 'Gara XYZ',
      },
    } as unknown as PartialSearchFilters;

    const result = validatorService.validate(validFilters);

    expect(result.isValid).toBe(true);
    expect(result.errors.size).toBe(0);
  });

  it('dovrebbe aggregare molteplici errori provenienti da strategie diverse', () => {
    const invalidFilters = {
      common: {
        dataDa: '2026-12-31',
        dataA: '2026-01-01', // ERRORE 1: Range date invertito (SearchRange)
      },
      diDai: {
        registrazione: {
          tipologiaRegistro: RegisterType.NESSUNO,
          codiceRegistro: 'REG-123', // ERRORE 2: Codice inserito ma tipo Nessuno (Registry)
        },
        modalitaFormazione: 'a' as DIDAIFormation,
        verifica: {
          conformitaCopie: true, // ERRORE 3: Conformità cercata ma modalità A (Formation)
        },
      },
      aggregate: null,
    } as unknown as PartialSearchFilters;

    const result = validatorService.validate(invalidFilters);

    expect(result.isValid).toBe(false);

    expect(result.errors.size).toBe(3);

    expect(result.errors.has('common.dataDa')).toBe(true);
    expect(result.errors.has('diDai.registrazione.codiceRegistro')).toBe(true);
    expect(result.errors.has('diDai.verifica.conformitaCopie')).toBe(true);
  });
});
