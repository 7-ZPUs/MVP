import { SearchFilter } from '../../value-objects/SearchFilter';
import { SearchResult } from '../../value-objects/SearchResult';

export interface ISearchDocumentsUC {
    execute(filters: SearchFilter[]): Promise<SearchResult[]>;
}