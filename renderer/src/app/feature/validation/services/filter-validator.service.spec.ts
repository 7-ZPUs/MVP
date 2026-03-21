import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FilterValidatorService } from './filter-validator.service';
import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationError } from '../../search/domain/search.models';

describe('FilterValidatorService', () => {
  let service: FilterValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterValidatorService],
    });

    service = TestBed.inject(FilterValidatorService);
  });

  it('dovrebbe restituire isValid: true se non ci sono strategie registrate', () => {
    const result = service.validate({} as PartialSearchFilters);
    expect(result.isValid).toBe(true);
    expect(result.errors.size).toBe(0);
  });

  it('dovrebbe restituire isValid: true se tutte le strategie passano con successo', () => {
    const mockStrategy: IFilterValidationStrategy = {
      validate: vi.fn().mockReturnValue(new Map()),
    };
    service.registerStrategy(mockStrategy);

    const result = service.validate({} as PartialSearchFilters);

    expect(result.isValid).toBe(true);
    expect(result.errors.size).toBe(0);
    expect(mockStrategy.validate).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe aggregare gli errori di strategie multiple sullo stesso campo o campi diversi', () => {
    const error1: ValidationError = { field: 'dataDa', message: 'Formato errato', code: 'ERR_1' };
    const error2: ValidationError = { field: 'dataDa', message: 'Data futura', code: 'ERR_2' };
    const error3: ValidationError = { field: 'titolo', message: 'Troppo corto', code: 'ERR_3' };

    const strategy1: IFilterValidationStrategy = {
      validate: vi.fn().mockReturnValue(new Map([['dataDa', [error1]]])),
    };
    const strategy2: IFilterValidationStrategy = {
      validate: vi.fn().mockReturnValue(
        new Map([
          ['dataDa', [error2]],
          ['titolo', [error3]],
        ]),
      ),
    };

    service.registerStrategy(strategy1);
    service.registerStrategy(strategy2);

    const result = service.validate({} as PartialSearchFilters);

    expect(result.isValid).toBe(false);
    expect(result.errors.size).toBe(2);

    expect(result.errors.get('dataDa')).toEqual([error1, error2]);
    expect(result.errors.get('titolo')).toEqual([error3]);
  });
});
