import { InjectionToken, Signal } from '@angular/core';
import {
  SearchFilters,
  SearchQuery,
  SearchState,
  ValidationResult,
} from '../../../../../../shared/domain/metadata/search.models';
import type { PartialSearchFilters } from '../../../../../../shared/domain/metadata';

export interface ISearchFacade {
  getState(): Signal<SearchState>;
  getCustomMetadataKeys(): Signal<string[]>;
  setQuery(query: SearchQuery): void;
  setFilters(filters: SearchFilters): void;
  search(): void;
  searchAdvanced(filter: SearchFilters): void;
  searchSemantic(query: SearchQuery): void;
  validateFilters(filters: PartialSearchFilters): ValidationResult;
  loadCustomMetadataKeys(dipId?: number | null): Promise<void>;
  cancelSearch(): void;
  retry(): void;
}

export const SEARCH_FACADE_TOKEN = new InjectionToken<ISearchFacade>('ISearchFacade');
