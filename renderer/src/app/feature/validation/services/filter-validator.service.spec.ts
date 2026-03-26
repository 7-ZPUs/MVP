import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FilterValidatorService } from './filter-validator.service';
import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters } from '../../../shared/domain/metadata';

// Mock delle strategie per isolare il test del Service
vi.mock('../strategies/registry-contradiction-validation.strategy', () => ({
  RegistryContradictionValidationStrategy: class {
    validate = vi.fn().mockReturnValue(new Map());
  },
}));
vi.mock('../strategies/formation-mode-contradiction.strategy', () => ({
  FormationModeContradictionStrategy: class {
    validate = vi.fn().mockReturnValue(new Map());
  },
}));
vi.mock('../strategies/search-range-validation.strategy', () => ({
  SearchRangeValidationStrategy: class {
    validate = vi.fn().mockReturnValue(new Map());
  },
}));
vi.mock('../strategies/aggregation-contradiction.strategy', () => ({
  AggregationContradictionStrategy: class {
    validate = vi.fn().mockReturnValue(new Map());
  },
}));

describe('FilterValidatorService', () => {
  let service: FilterValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterValidatorService],
    });

    service = TestBed.inject(FilterValidatorService);
  });

  it('dovrebbe inizializzarsi automaticamente con le 4 strategie di ricerca', () => {
    const strategies = (service as any).strategies;
    expect(strategies.length).toBe(4); // Aggiornato a 4
  });

  it('dovrebbe aggregare correttamente gli errori di una nuova strategia aggiunta dinamicamente', () => {
    const mockStrategy: IFilterValidationStrategy = {
      validate: vi
        .fn()
        .mockReturnValue(
          new Map([
            ['testField', [{ field: 'testField', code: 'TEST_001', message: 'Errore mock' }]],
          ]),
        ),
    };

    service.registerStrategy(mockStrategy);
    const result = service.validate({} as PartialSearchFilters);

    expect(result.isValid).toBe(false);
    expect(result.errors.has('testField')).toBe(true);
  });

  it('dovrebbe restituire isValid: true se tutte le strategie passano con successo', () => {
    const result = service.validate({} as PartialSearchFilters);

    expect(result.isValid).toBe(true);
    expect(result.errors.size).toBe(0);
  });
});
