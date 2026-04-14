import { inject, injectable } from "tsyringe";
import { ISearchSemanticUC, SemanticSearchMatch } from "../ISearchSemanticUC";
import {
  IDocumentRepository,
  DOCUMENTO_REPOSITORY_TOKEN,
} from "../../../repo/IDocumentRepository";
import {
  IWordEmbedding,
  WORD_EMBEDDING_PORT_TOKEN,
} from "../../../repo/IWordEmbedding";
import { IVectorRepository } from "../../../repo/IVectorRepository";

@injectable()
export class SearchSemanticUC implements ISearchSemanticUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
    @inject(WORD_EMBEDDING_PORT_TOKEN)
    private readonly vectorRepo: IVectorRepository,
    @inject(WORD_EMBEDDING_PORT_TOKEN)
    private readonly aiAdapter: IWordEmbedding,
  ) {}

  async execute(query: string): Promise<SemanticSearchMatch[]> {
    const queryVector = await this.aiAdapter.generateEmbedding(query);
    let docIds = await this.vectorRepo.searchSimilarVectors(queryVector, 10);
    return docIds.map(({ documentId, score }) => {
      const document = this.documentRepo.getById(documentId);
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }
      return { document, score };
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
