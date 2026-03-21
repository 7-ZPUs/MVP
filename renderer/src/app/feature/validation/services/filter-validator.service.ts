import { Injectable } from '@angular/core';
import {
  IFilterValidator,
  IFilterValidationStrategy,
} from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationResult, ValidationError } from '../../search/domain';

import { RegistryContradictionValidationStrategy } from '../strategies/registry-contradiction-validation.strategy';
import { FormationModeContradictionStrategy } from '../strategies/formation-mode-contradiction.strategy';
import { SearchRangeValidationStrategy } from '../strategies/search-range-validation.strategy';
//TODO import { AggregationContradictionStrategy } from '../strategies/aggregation-contradiction.strategy';

@Injectable({ providedIn: 'root' })
export class FilterValidatorService implements IFilterValidator {
  private readonly strategies: IFilterValidationStrategy[] = [];

  constructor() {
    this.registerStrategy(new RegistryContradictionValidationStrategy());
    this.registerStrategy(new FormationModeContradictionStrategy());
    this.registerStrategy(new SearchRangeValidationStrategy());
  }

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
