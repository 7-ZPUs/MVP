import { inject, injectable } from 'tsyringe';
import { ISearchSemanticUC } from '../ISearchSemanticUC';
import { IDocumentRepository, DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import { SearchResult } from '../../../../../shared/domain/metadata/search.models';

@injectable()
export class SearchSemanticUC implements ISearchSemanticUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly documentRepo: IDocumentRepository
    ) {}

    async execute(query: string): Promise<SearchResult[]> {
        const results = await this.documentRepo.searchDocumentSemantic(query);
        return results.map(({ document, score }) => {
            const metadata = document.getMetadata();
            return {
                documentId: document.getUuid(),
                name:  metadata.find(m => m.name === 'name')?.value  ?? '',
                type:  metadata.find(m => m.name === 'type')?.value  ?? '',
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