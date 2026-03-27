import { SearchResult } from '../../value-objects/SearchResult';

export interface ISearchSemanticUC {
    execute(query: string): Promise<SearchResult[]>;
}