import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IDipRepository } from '../../../repo/IDipRepository';
import { DIP_REPOSITORY_TOKEN } from '../../../repo/IDipRepository';
import type { IDocumentClassRepository } from '../../../repo/IDocumentClassRepository';
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from '../../../repo/IDocumentClassRepository';
import type { ICheckDipIntegrityStatusUC } from '../ICheckDipIntegrityStatusUC';

@injectable()
export class CheckDipIntegrityStatusUC implements ICheckDipIntegrityStatusUC {
    constructor(
        @inject(DIP_REPOSITORY_TOKEN)
        private readonly dipRepo: IDipRepository,

        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly documentClassRepo: IDocumentClassRepository,
    ) { }

    execute(dipId: number): IntegrityStatusEnum {
        const dip = this.dipRepo.getById(dipId);
        if (!dip) {
            throw new Error(`Dip with id ${dipId} not found`);
        }

        const status = this.documentClassRepo.getAggregatedIntegrityStatusByDipId(dipId);
        this.dipRepo.updateIntegrityStatus(dipId, status);
        return status;
    }
}
