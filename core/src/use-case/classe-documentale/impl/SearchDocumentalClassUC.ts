import { inject, injectable } from 'tsyringe';
import { ISearchDocumentalClassUC } from '../ISearchDocumentalClassUC';
import { IDocumentClassRepository, DOCUMENT_CLASS_REPOSITORY_TOKEN } from '../../../repo/IDocumentClassRepository';
import { DocumentClass } from '../../../entity/DocumentClass';

@injectable()
export class SearchDocumentalClassUC implements ISearchDocumentalClassUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) {}

    execute(name: string): DocumentClass[] {
        return this.repo.searchDocumentalClasses(name);
    }
}