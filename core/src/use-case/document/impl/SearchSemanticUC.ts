import { inject, injectable } from 'tsyringe';
import { ISearchSemanticUC, SearchResult } from '../ISearchSemanticUC';
import { IDocumentRepository, DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';

@injectable()
export class SearchSemanticUC implements ISearchSemanticUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly documentRepo: IDocumentRepository
    ) {}

    async execute(query: string): Promise<SearchResult[]> {
        const results = await this.documentRepo.searchDocumentSemantic(query);
        return results.map(({ document, score }) => ({ // attenzione che ritorna solamente id e score, non tutto il documento !!
            id: document.getId()!,
            score,
        }));
    }

    /**
    QUESTO SE VUOLE DIRETTAMENTE RITORANATI I DOCUMENTI, L'alternativa soprà il lazy_loading più efficente
    async execute(query: string): Promise<DocumentDTO[]> {
        const results = await this.documentRepo.searchDocumentSemantic(query);
        return results.map(({ document }) => document.toDTO());
    }
     */
}