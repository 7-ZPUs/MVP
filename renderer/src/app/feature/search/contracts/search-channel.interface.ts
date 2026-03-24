import { Observable } from 'rxjs';
import {
  SearchFilters,
  SearchQuery,
  SearchResult,
} from '../../../shared/domain/metadata/search.models';

export interface ISearchChannel {
  search(query: SearchQuery, signal: AbortSignal): Observable<SearchResult[]>;
  searchAdvanced(filters: SearchFilters, signal: AbortSignal): Observable<SearchResult[]>;
  searchSemantic(query: SearchQuery, signal: AbortSignal): Observable<SearchResult[]>;
}
