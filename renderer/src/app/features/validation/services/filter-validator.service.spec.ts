import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FilterValidatorService } from './filter-validator.service';
import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters } from '../../../../../../shared/domain/metadata';

// RIMOSSI i vi.mock() per compatibilità con il TestBed di Angular

describe('FilterValidatorService', () => {
  let service: FilterValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterValidatorService],
    });

    service = TestBed.inject(FilterValidatorService);
  });

  it('dovrebbe inizializzarsi automaticamente con le 5 strategie di ricerca', () => {
    const strategies = (service as any).strategies;
    expect(strategies.length).toBe(5);
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
