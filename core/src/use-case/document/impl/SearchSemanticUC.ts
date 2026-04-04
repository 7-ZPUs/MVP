import { inject, injectable } from "tsyringe";
import { ISearchSemanticUC } from "../ISearchSemanticUC";
import {
  IDocumentRepository,
  DOCUMENTO_REPOSITORY_TOKEN,
} from "../../../repo/IDocumentRepository";
import { SearchResult } from "../../../../../shared/domain/metadata/search.models";
import {
  IWordEmbedding,
  WORD_EMBEDDING_PORT_TOKEN,
} from "../../../repo/IWordEmbedding";

@injectable()
export class SearchSemanticUC implements ISearchSemanticUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
    @inject(WORD_EMBEDDING_PORT_TOKEN)
    private readonly aiAdapter: IWordEmbedding,
  ) {}

  async execute(query: string): Promise<SearchResult[]> {
    const queryVector = await this.aiAdapter.generateEmbedding(query);
    const results = await this.documentRepo.searchDocumentSemantic(queryVector);
    return results.map(({ document, score }) => {
      const metadata = document.getMetadata();
      return {
        documentId: String(document.getId()),
        name: metadata.findNodeByName("nome")?.getStringValue() ?? "",
        type: metadata.findNodeByName("tipoDocumento")?.getStringValue() ?? "",
        score,
      };
    });
  }

  /**
    QUESTO SE VUOLE DIRETTAMENTE RITORANATI I DOCUMENTI, L'alternativa soprà il lazy_loading più efficente
    async execute(query: string): Promise<DocumentDTO[]> {
        const results = await this.documentRepo.searchDocumentSemantic(query);
        return results.map(({ document }) => document.toDTO());
    }
     */
}
