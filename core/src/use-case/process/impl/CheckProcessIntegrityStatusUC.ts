import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IProcessRepository } from '../../../repo/IProcessRepository';
import { PROCESS_REPOSITORY_TOKEN } from '../../../repo/IProcessRepository';
import type { IDocumentRepository } from '../../../repo/IDocumentRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import type { ICheckProcessIntegrityStatusUC } from '../ICheckProcessIntegrityStatusUC';

@injectable()
export class CheckProcessIntegrityStatusUC implements ICheckProcessIntegrityStatusUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly processRepo: IProcessRepository,

        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly documentRepo: IDocumentRepository,
    ) { }

    execute(processId: number): IntegrityStatusEnum {
        const process = this.processRepo.getById(processId);
        if (!process) {
            throw new Error(`Process with id ${processId} not found`);
        }

        const status = this.documentRepo.getAggregatedIntegrityStatusByProcessId(processId);
        this.processRepo.updateIntegrityStatus(processId, status);
        return status;
    }
}
