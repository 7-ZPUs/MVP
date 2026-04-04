import { CommonFilterValues } from "./search-common-filters-models";
import { DiDaiFilterValues } from "./search-diDai-filters-models";
import { AggregateFilterValues } from "./search-aggregate-filters-models";
import { SubjectCriteria } from "./search-subject-filters-models";
import { SearchQueryType } from "./search.enum";
import { AppError } from "../../../renderer/src/app/shared/domain/error.models";
import { CustomFilterValues } from "./search-custom-filters-models";
import { ISearchResult } from "./search-result.models";

export interface SearchQuery {
  text: string;
  type: SearchQueryType;
  useSemanticSearch: boolean;
}

export interface SearchFilters {
  common: CommonFilterValues;
  diDai: DiDaiFilterValues;
  aggregate: AggregateFilterValues;
  subject: SubjectCriteria[] | [];
  customMeta: CustomFilterValues | null;
}

export interface PartialSearchFilters {
  common: CommonFilterValues;
  diDai: DiDaiFilterValues;
  aggregate: AggregateFilterValues;
  customMeta: CustomFilterValues | null;
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
  results: ISearchResult[];
  loading: boolean;
  isSearching: boolean;
  error: AppError | null;
  validationErrors: Map<string, ValidationError>;
}

export type FilterValidatorFn = (
  filters: PartialSearchFilters,
) => ValidationResult;
