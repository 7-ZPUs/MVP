import { inject, injectable } from "tsyringe";
import { ISearchDocumentsUC } from "../ISearchDocumentsUC";
import {
  DOCUMENT_SEARCH_PORT_TOKEN,
  ISearchDocumentPort,
} from "../../../repo/IDocumentRepository";
import { SearchDocumentsQuery } from "../../../entity/search/SearchQuery.model";
import { Document } from "../../../entity/Document";

export interface MetadataCondition {
  key: string;
  value: string | null;
}

export interface MetadataGroupCondition {
  operator: "AND" | "OR";
  conditions: Array<MetadataCondition | MetadataGroupCondition>;
}

@injectable()
export class SearchDocumentsUC implements ISearchDocumentsUC {
  constructor(
    @inject(DOCUMENT_SEARCH_PORT_TOKEN)
    private readonly documentRepo: ISearchDocumentPort,
  ) {}

  execute(filters: SearchDocumentsQuery): Document[] {
    const results = this.documentRepo.searchDocument(filters);
    return results;
  }
}
