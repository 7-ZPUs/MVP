import { SearchFilters } from '../../../../shared/domain/metadata/search.models';
import { SearchResult } from '../../../../shared/domain/metadata/search.models';

export interface ISearchDocumentsUC {
    execute(filters: SearchFilters): Promise<SearchResult[]>;
}