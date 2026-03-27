import { Signal } from '@angular/core';
import {
  SearchFilters,
  SearchQuery,
  SearchState,
} from '../../../../../../shared/metadata/search.models';

export interface ISearchFacade {
  getState(): Signal<SearchState>;
  setQuery(query: SearchQuery): void;
  setFilters(filters: SearchFilters): void;
  searchAdvanced(filter: SearchFilters): void;
  searchSemantic(query: SearchQuery): void;
  cancelSearch(): void;
  retry(): void;
}
