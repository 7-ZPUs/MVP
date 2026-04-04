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

@injectable()
export class SearchSemanticUC implements ISearchSemanticUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
    @inject(WORD_EMBEDDING_PORT_TOKEN)
    private readonly aiAdapter: IWordEmbedding,
  ) {}

  async execute(query: string): Promise<SemanticSearchMatch[]> {
    const queryVector = await this.aiAdapter.generateEmbedding(query);
    return this.documentRepo.searchDocumentSemantic(queryVector);
  }

  /**
    QUESTO SE VUOLE DIRETTAMENTE RITORANATI I DOCUMENTI, L'alternativa soprà il lazy_loading più efficente
    async execute(query: string): Promise<DocumentDTO[]> {
        const results = await this.documentRepo.searchDocumentSemantic(query);
        return results.map(({ document }) => document.toDTO());
    }
     */
}
