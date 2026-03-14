import { SearchQueryType } from '../domain/search.enum';

export interface SearchQuery {
  text: string;
  type: SearchQueryType;
  useSemanticSearch: boolean;
}

export interface SearchResult {
  documentId: string;
  name: string;
  type: string;
  score: number | null;
}
