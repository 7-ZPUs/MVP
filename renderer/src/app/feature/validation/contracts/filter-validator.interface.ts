import {
  PartialSearchFilters,
  ValidationError,
  ValidationResult,
} from '../../../../../../shared/domain/metadata';

export interface IFilterValidationStrategy {
  validate(filters: PartialSearchFilters): Map<string, ValidationError[]>;
}

export interface IFilterValidator {
  validate(filters: PartialSearchFilters): ValidationResult;
  registerStrategy(strategy: IFilterValidationStrategy): void;
}
