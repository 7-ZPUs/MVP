import { CommonFilterValues } from './search-common-filters-models';
import { DiDaiFilterValues } from './search-diDai-filters-models';
import { AggregateFilterValues } from './search-aggregate-filters-models';
import { SubjectCriteria } from './search-subject-filters-models';
import { SearchQueryType } from './search.enum';
import { AppError } from '../error.models';
import { CustomFilterValues } from './search-custom-filters-models';

export interface SearchQuery {
  text: string;
  type: SearchQueryType;
  useSemanticSearch: boolean;
}

export interface MetadataFilter {
  key: string;
  value: string | null;
}

export interface SearchFilters {
  filters: MetadataFilter[];
  subject: SubjectCriteria | null;
}

export interface PartialSearchFilters {
  common: CommonFilterValues;
  diDai: DiDaiFilterValues;
  aggregate: AggregateFilterValues;
  customMeta: CustomFilterValues | null;
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

export type FilterValidatorFn = (
  filters: PartialSearchFilters,
) => ValidationResult;
