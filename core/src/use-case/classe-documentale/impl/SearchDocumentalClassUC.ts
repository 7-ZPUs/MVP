import { inject, injectable } from 'tsyringe';
import { ISearchDocumentalClassUC } from '../ISearchDocumentalClassUC';
import { IDocumentClassRepository } from '../../../repo/IDocumentClassRepository';
import { DocumentClass } from '../../../entity/DocumentClass';

@injectable()
export class SearchDocumentalClassUC implements ISearchDocumentalClassUC {
    constructor(
        @inject('IDocumentClassRepository')
        private readonly repo: IDocumentClassRepository
    ) {}

    execute(name: string): DocumentClass[] {
        return this.repo.searchDocumentalClasses(name);
    }
}