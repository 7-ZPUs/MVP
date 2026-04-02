import { inject, injectable } from 'tsyringe';
import { ISearchDocumentalClassUC } from '../ISearchDocumentalClassUC';
import { IDocumentClassRepository, DOCUMENT_CLASS_REPOSITORY_TOKEN } from '../../../repo/IDocumentClassRepository';
import { DocumentClass } from '../../../entity/DocumentClass';
import { SearchResult } from '../../../../../shared/domain/metadata'

@injectable()
export class SearchDocumentalClassUC implements ISearchDocumentalClassUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) {}

    async execute(name: string): Promise<SearchResult[]> {
        const results = this.repo.searchDocumentalClasses(name);
        return results.map((DocumentClass) => {
            return {
                documentId: String(DocumentClass.getId()),
                name: DocumentClass.getName(),
                type: '',
                score: null,
            };
        });
    }
}