import { CommonFilterValues } from './search-common-filters-models';
import { DiDaiFilterValues } from './search-diDai-filters-models';
import { AggregateFilterValues } from './search-aggregate-filters-models';
import { SubjectCriteria } from './search-subject-filters-models';
import { SearchQueryType } from './search.enum';
import { AppError } from '../../../shared/domain/error.models';
import { CustomFilterValues } from './search-custom-filters-models';
import { PartialSearchFilters } from './partial-filters-models';

export interface SearchQuery {
  text: string;
  type: SearchQueryType;
  useSemanticSearch: boolean;
}

export interface SearchFilters {
  common: CommonFilterValues;
  diDai: DiDaiFilterValues;
  aggregate: AggregateFilterValues;
  subject: SubjectCriteria | null;
  custom: CustomFilterValues | null;
}

export interface SearchResult {
  documentId: string;
  name: string;
  type: string;
  score: number | null;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Map<string, ValidationError[]>;
}

export interface SearchState {
  query: SearchQuery;
  filters: SearchFilters;
  results: SearchResult[];
  loading: boolean;
  isSearching: boolean;
  error: AppError | null;
  validationErrors: Map<string, ValidationError>;
}

export type FilterValidatorFn = (filters: PartialSearchFilters) => ValidationResult;
