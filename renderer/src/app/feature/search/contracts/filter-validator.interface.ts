import { PartialSearchFilters, ValidationError, ValidationResult } from './search.models';
import { FilterFieldType } from '../domain/search.enum';

export interface IFilterValidator {
  validate(filters: PartialSearchFilters): ValidationResult;
  validateField(field: string, value: unknown, type: FilterFieldType): ValidationError | null;
}
