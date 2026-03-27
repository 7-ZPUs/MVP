import { SearchResult } from '../../../../shared/domain/metadata/search.models';

export interface ISearchSemanticUC {
    execute(query: string): Promise<SearchResult[]>;
}