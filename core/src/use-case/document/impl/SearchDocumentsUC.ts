import { inject, injectable } from "tsyringe";
import { ISearchDocumentsUC } from "../ISearchDocumentsUC";
import {
  IDocumentRepository,
  DOCUMENTO_REPOSITORY_TOKEN,
} from "../../../repo/IDocumentRepository";
import {
  SearchFilters,
  SearchResult,
} from "../../../../../shared/domain/metadata";

@injectable()
export class SearchDocumentsUC implements ISearchDocumentsUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(filters: SearchFilters): Promise<SearchResult[]> {
    const results = this.documentRepo.searchDocument(filters);
    return results.map((document) => {
      const metadata = document.getMetadata();
      const name =
        metadata.findNodeByName("nome")?.getStringValue() ??
        metadata.findNodeByName("NomeDelDocumento")?.getStringValue() ??
        "";
      const type =
        metadata.findNodeByName("tipoDocumento")?.getStringValue() ??
        metadata.findNodeByName("TipologiaDocumentale")?.getStringValue() ??
        "";

      return {
        documentId: document.getUuid(),
        name,
        type,
        score: null,
      };
    });
  }
}
