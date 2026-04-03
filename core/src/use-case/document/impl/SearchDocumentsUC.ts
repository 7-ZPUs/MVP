import { inject, injectable } from "tsyringe";
import { ISearchDocumentsUC } from "../ISearchDocumentsUC";
import {
  IDocumentRepository,
  DOCUMENTO_REPOSITORY_TOKEN,
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
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(filters: SearchDocumentsQuery): Promise<Document[]> {
    const results = this.documentRepo.searchDocument(filters);
    return results;
  }
}