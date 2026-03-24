import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IDocumentRepository } from '../../../repo/IDocumentRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { ICheckDocumentIntegrityStatusUC } from '../ICheckDocumentIntegrityStatusUC';

@injectable()
export class CheckDocumentIntegrityStatusUC implements ICheckDocumentIntegrityStatusUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly documentRepo: IDocumentRepository,

        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository,
    ) { }

    execute(documentId: number): IntegrityStatusEnum {
        const document = this.documentRepo.getById(documentId);
        if (!document) {
            throw new Error(`Document with id ${documentId} not found`);
        }

        const status = this.fileRepo.getAggregatedIntegrityStatusByDocumentId(documentId);
        this.documentRepo.updateIntegrityStatus(documentId, status);
        return status;
    }
}
