import { inject, injectable } from 'tsyringe';
import type { Document } from '../../../entity/Document';
import type { IDocumentRepository } from '../../../repo/IDocumentRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import type { IGetDocumentByIdUC } from '../IGetDocumentByIdUC';

@injectable()
export class GetDocumentByIdUC implements IGetDocumentByIdUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentRepository
    ) { }

    execute(id: number): Document | null {
        return this.repo.getById(id);
    }
}
