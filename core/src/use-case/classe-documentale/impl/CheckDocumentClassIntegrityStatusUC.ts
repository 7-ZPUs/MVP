import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IDocumentClassRepository } from '../../../repo/IDocumentClassRepository';
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from '../../../repo/IDocumentClassRepository';
import type { IProcessRepository } from '../../../repo/IProcessRepository';
import { PROCESS_REPOSITORY_TOKEN } from '../../../repo/IProcessRepository';
import type { ICheckDocumentClassIntegrityStatusUC } from '../ICheckDocumentClassIntegrityStatusUC';

@injectable()
export class CheckDocumentClassIntegrityStatusUC implements ICheckDocumentClassIntegrityStatusUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly documentClassRepo: IDocumentClassRepository,

        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly processRepo: IProcessRepository,
    ) { }

    execute(documentClassId: number): IntegrityStatusEnum {
        const documentClass = this.documentClassRepo.getById(documentClassId);
        if (!documentClass) {
            throw new Error(`DocumentClass with id ${documentClassId} not found`);
        }

        const status = this.processRepo.getAggregatedIntegrityStatusByDocumentClassId(documentClassId);
        this.documentClassRepo.updateIntegrityStatus(documentClassId, status);
        return status;
    }
}
