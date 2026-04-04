import {
  PartialSearchFilters,
  ValidationError,
  ValidationResult,
} from '../../../../../../shared/domain/metadata';
import { InjectionToken } from '@angular/core';

export interface IFilterValidationStrategy {
  validate(filters: PartialSearchFilters): Map<string, ValidationError[]>;
}

export interface IFilterValidator {
  validate(filters: PartialSearchFilters): ValidationResult;
  registerStrategy(strategy: IFilterValidationStrategy): void;
}

export const FILTER_VALIDATOR_TOKEN = new InjectionToken<IFilterValidator>('FILTER_VALIDATOR_TOKEN');