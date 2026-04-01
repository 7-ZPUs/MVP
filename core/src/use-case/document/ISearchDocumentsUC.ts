import { SearchFilters, SearchResult } from "../../../../shared/domain/metadata";


export interface ISearchDocumentsUC {
    execute(filters: SearchFilters): Promise<SearchResult[]>;
}