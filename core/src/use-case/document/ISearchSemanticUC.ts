import { Document } from "../../entity/Document";

export interface SemanticSearchMatch {
  document: Document;
  score: number;
}

export interface ISearchSemanticUC {
  execute(query: string): Promise<SemanticSearchMatch[]>;
}
