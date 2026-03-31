import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IProcessRepository } from '../../../repo/IProcessRepository';
import { PROCESS_REPOSITORY_TOKEN } from '../../../repo/IProcessRepository';
import type { ICheckProcessIntegrityStatusUC } from '../ICheckProcessIntegrityStatusUC';
import { HASHING_SERVICE_TOKEN, IHashingService } from '../../../services/IHashingService';

@injectable()
export class CheckProcessIntegrityStatusUC implements ICheckProcessIntegrityStatusUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly processRepo: IProcessRepository,

        @inject(HASHING_SERVICE_TOKEN)
        private readonly hashingService: IHashingService,
    ) { }

    execute(processId: number): Promise<IntegrityStatusEnum> {
        const process = this.processRepo.getById(processId);
        if (!process) {
            throw new Error(`Process with id ${processId} not found`);
        }

        if (process.getId() === null) {
            throw new Error(`Process has not benn saved yet, cannot check integrity`);
        }

        return this.hashingService.checkProcessIntegrity(process.getId() as number);
    }
}
