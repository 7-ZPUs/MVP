import { inject, injectable } from 'tsyringe';
import { ISearchDocumentsUC } from '../ISearchDocumentsUC';
import { IDocumentRepository, DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import { SearchFilters, SearchResult } from '../../../../../shared/domain/metadata/search.models';

@injectable()
export class SearchDocumentsUC implements ISearchDocumentsUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly documentRepo: IDocumentRepository
    ) {}

    async execute(filters: SearchFilters): Promise<SearchResult[]> {
        const results = this.documentRepo.searchDocument(filters);
        return results.map((document) => {
            const metadata = document.getMetadata();
            return {
                documentId: document.getUuid(),
                name:  metadata.find(m => m.name === 'nome')?.value  ?? '',
                type:  metadata.find(m => m.name === 'tipoDocumento')?.value ?? '',
                score: null,
            };
        });
    }
}