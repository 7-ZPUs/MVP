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
        return results.map(({ document, score }) => ({
            id: document.getId()!,
            score,
        }));
    }
}