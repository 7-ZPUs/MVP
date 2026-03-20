import { inject, injectable } from 'tsyringe';
import { ISearchDocumentsUC } from '../ISearchDocumentsUC';
import { DOCUMENTO_REPOSITORY_TOKEN, IDocumentRepository } from '../../../repo/IDocumentRepository';
import { SearchFilter } from '../../../value-objects/SearchFilter';
import { Document } from '../../../entity/Document';

@injectable()
export class SearchDocumentsUC implements ISearchDocumentsUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentRepository
    ) {}

    execute(filters: SearchFilter[]): Document[] {
        return this.repo.searchDocument(filters);
    }
}