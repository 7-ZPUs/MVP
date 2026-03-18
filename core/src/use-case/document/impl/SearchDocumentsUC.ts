import { inject, injectable } from 'tsyringe';
import { ISearchDocumentsUC } from '../ISearchDocumentsUC';
import { IDocumentRepository } from '../../../repo/IDocumentRepository';
import { SearchFilter } from '../../../value-objects/SearchFilter';
import { Document } from '../../../entity/Document';

@injectable()
export class SearchDocumentsService implements ISearchDocumentsUC {
    constructor(
        @inject('IDocumentRepository')
        private readonly repo: IDocumentRepository
    ) {}

    execute(filters: SearchFilter[]): Document[] {
        return this.repo.searchDocument(filters);
    }
}