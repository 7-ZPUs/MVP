import { Observable } from 'rxjs';
import { SearchFilters, SearchQuery } from '../../../../../../shared/domain/metadata/search.models';
import { ISearchResult } from '../../../../../../shared/domain/metadata/search-result.models';

export interface ISearchChannel {
  search(query: SearchQuery, signal: AbortSignal): Observable<ISearchResult[]>;
  searchAdvanced(filters: SearchFilters, signal: AbortSignal): Observable<ISearchResult[]>;
  searchSemantic(query: SearchQuery, signal: AbortSignal): Observable<ISearchResult[]>;
}
