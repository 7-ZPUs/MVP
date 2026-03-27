export interface SearchResult {
    documentId: string;
    name: string;
    type: string;
    score: number | null;
}