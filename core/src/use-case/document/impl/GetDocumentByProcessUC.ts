import { inject, injectable } from 'tsyringe';
import type { Document } from '../../../entity/Document';
import { DOCUMENTO_REPOSITORY_TOKEN, IDocumentRepository } from '../../../repo/IDocumentRepository';
import type { IGetDocumentByProcessUC } from '../IGetDocumentByProcessUC';

@injectable()
export class GetDocumentByProcessUC implements IGetDocumentByProcessUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentRepository
    ) { }

    execute(processId: number): Document[] {
        return this.repo.getByProcessId(processId);
    }
}
