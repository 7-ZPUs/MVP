import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IDipRepository } from '../../../repo/IDipRepository';
import { DIP_REPOSITORY_TOKEN } from '../../../repo/IDipRepository';
import type { IDocumentClassRepository } from '../../../repo/IDocumentClassRepository';
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from '../../../repo/IDocumentClassRepository';
import type { ICheckDipIntegrityStatusUC } from '../ICheckDipIntegrityStatusUC';
import { HASHING_SERVICE_TOKEN, IHashingService } from '../../../services/IHashingService';

@injectable()
export class CheckDipIntegrityStatusUC implements ICheckDipIntegrityStatusUC {
    constructor(
        @inject(DIP_REPOSITORY_TOKEN)
        private readonly dipRepo: IDipRepository,

        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly documentClassRepo: IDocumentClassRepository,

        @inject(HASHING_SERVICE_TOKEN)
        private readonly hashingService: IHashingService,
    ) { }

    execute(dipId: number): Promise<IntegrityStatusEnum> {
        const dip = this.dipRepo.getById(dipId);
        if (!dip) {
            throw new Error(`Dip with id ${dipId} not found`);
        }

        if(dip.getId() === null) {
            throw new Error(`Dip has not been saved yet, cannot check integrity`);
        }

        return this.hashingService.checkDipIntegrity(dip.getId() as number);
    }
}
