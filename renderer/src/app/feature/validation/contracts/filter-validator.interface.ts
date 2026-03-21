import {
  PartialSearchFilters,
  ValidationError,
  ValidationResult,
} from '../../search/domain/search.models';

export interface IFilterValidationStrategy {
  validate(filters: PartialSearchFilters): Map<string, ValidationError[]>;
}

export interface IFilterValidator {
  validate(filters: PartialSearchFilters): ValidationResult;
  registerStrategy(strategy: IFilterValidationStrategy): void;
}
