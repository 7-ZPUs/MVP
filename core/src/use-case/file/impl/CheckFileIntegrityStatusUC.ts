import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { IHashingService } from '../../../services/IHashingService';
import { HASHING_SERVICE_TOKEN } from '../../../services/IHashingService';
import type { ICheckFileIntegrityStatusUC } from '../ICheckFileIntegrityStatusUC';

@injectable()
export class CheckFileIntegrityStatusUC implements ICheckFileIntegrityStatusUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository,

        @inject(HASHING_SERVICE_TOKEN)
        private readonly hashingService: IHashingService,
    ) { }

    async execute(fileId: number): Promise<IntegrityStatusEnum> {
        const file = this.fileRepo.getById(fileId);
        if (!file) {
            throw new Error(`File with id ${fileId} not found`);
        }

        const result = await this.hashingService.checkFileIntegrity(file.getPath(), file.getHash());

        file.setIntegrityStatus(result);

        this.fileRepo.updateIntegrityStatus(fileId, result);

        return result;
    }
}
