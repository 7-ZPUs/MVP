import { inject, injectable } from 'tsyringe';
import { ISearchDocumentsUC } from '../ISearchDocumentsUC';
import { DOCUMENTO_REPOSITORY_TOKEN, IDocumentRepository } from '../../../repo/IDocumentRepository';
import { SearchFilter } from '../../../value-objects/SearchFilter';
import { SearchResult } from '../../../value-objects/SearchResult';

@injectable()
export class SearchDocumentsUC implements ISearchDocumentsUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentRepository
    ) {}

    async execute(filters: SearchFilter[]): Promise<SearchResult[]> {
        const results = this.repo.searchDocument(filters);
        return results.map((document) => {
            const metadata = document.getMetadata();
            return {
                documentId: document.getUuid(),
                name:  metadata.find(m => m.name === 'name')?.value  ?? '',
                type:  metadata.find(m => m.name === 'type')?.value  ?? '',
                score: null,
            };
        });
    }
}