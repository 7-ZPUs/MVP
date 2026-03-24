import { inject, injectable } from 'tsyringe';
import type { Document } from '../../../entity/Document';
import { DOCUMENTO_REPOSITORY_TOKEN, IDocumentRepository } from '../../../repo/IDocumentRepository';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IGetDocumentByStatusUC } from '../IGetDocumentByStatusUC';

@injectable()
export class GetDocumentByStatusUC implements IGetDocumentByStatusUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentRepository
    ) { }

    execute(status: IntegrityStatusEnum): Document[] {
        return this.repo.getByStatus(status);
    }
}
