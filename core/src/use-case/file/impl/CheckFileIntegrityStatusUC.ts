import { inject, injectable } from 'tsyringe';
import fs from 'node:fs';

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
        const expectedHash = file.getHash();

        // Se non abbiamo un hash atteso, non possiamo validare: lasciamo UNKNOWN.
        if (!expectedHash) {
            this.fileRepo.updateIntegrityStatus(fileId, IntegrityStatusEnum.UNKNOWN);
            return IntegrityStatusEnum.UNKNOWN;
        }

        const path = file.getPath();

        // Legge il file dal percorso noto nel dominio.
        const buffer = fs.readFileSync(path);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

        const calculatedHash = await this.hashingService.calcolaHash(arrayBuffer);

        const status = calculatedHash === expectedHash
            ? IntegrityStatusEnum.VALID
            : IntegrityStatusEnum.INVALID;

        this.fileRepo.updateIntegrityStatus(fileId, status);

        return status;
    }
}
