export interface SearchResult {
    id: number; // id del documento
    score: number; // punteggio similarità
}

export interface ISearchSemanticUC {
    execute(query: string): Promise<SearchResult[]>;
}