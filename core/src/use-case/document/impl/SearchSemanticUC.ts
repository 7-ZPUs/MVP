import { inject, injectable } from "tsyringe";
import { ISearchSemanticUC, SemanticSearchMatch } from "../ISearchSemanticUC";
import {
  DOCUMENT_GET_BY_ID_PORT_TOKEN,
  IGetDocumentByIdPort,
} from "../../../repo/IDocumentRepository";
import {
  IWordEmbedding,
  WORD_EMBEDDING_PORT_TOKEN,
} from "../../../repo/IWordEmbedding";
import {
  ISearchSimilarVectorsPort,
  VECTOR_SEARCH_SIMILAR_PORT_TOKEN,
} from "../../../repo/IVectorRepository";

@injectable()
export class SearchSemanticUC implements ISearchSemanticUC {
  constructor(
    @inject(DOCUMENT_GET_BY_ID_PORT_TOKEN)
    private readonly documentRepo: IGetDocumentByIdPort,
    @inject(VECTOR_SEARCH_SIMILAR_PORT_TOKEN)
    private readonly vectorRepo: ISearchSimilarVectorsPort,
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
