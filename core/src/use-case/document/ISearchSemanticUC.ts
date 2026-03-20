export interface SearchResult {
    id: number;
    score: number;
}

export interface ISearchSemanticUC {
    execute(query: string): Promise<SearchResult[]>;
}