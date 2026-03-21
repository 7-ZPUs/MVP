import { Injectable } from '@angular/core';
import {
  IFilterValidator,
  IFilterValidationStrategy,
} from '../contracts/filter-validator.interface';
import {
  PartialSearchFilters,
  ValidationResult,
  ValidationError,
} from '../../search/domain/search.models';

@Injectable({ providedIn: 'root' })
export class FilterValidatorService implements IFilterValidator {
  private readonly strategies: IFilterValidationStrategy[] = [];

  public registerStrategy(strategy: IFilterValidationStrategy): void {
    this.strategies.push(strategy);
  }

  public validate(filters: PartialSearchFilters): ValidationResult {
    const allErrors = new Map<string, ValidationError[]>();

    for (const strategy of this.strategies) {
      const strategyErrors = strategy.validate(filters);

      strategyErrors.forEach((errors, field) => {
        const existing = allErrors.get(field) || [];
        allErrors.set(field, [...existing, ...errors]);
      });
    }

    return {
      isValid: allErrors.size === 0,
      errors: allErrors,
    };
  }
}
