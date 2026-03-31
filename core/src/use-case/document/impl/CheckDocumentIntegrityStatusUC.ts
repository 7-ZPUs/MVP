import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { IDocumentRepository } from '../../../repo/IDocumentRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import type { ICheckDocumentIntegrityStatusUC } from '../ICheckDocumentIntegrityStatusUC';
import { HASHING_SERVICE_TOKEN, IHashingService } from '../../../services/IHashingService';

@injectable()
export class CheckDocumentIntegrityStatusUC implements ICheckDocumentIntegrityStatusUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly documentRepo: IDocumentRepository,

        @inject(HASHING_SERVICE_TOKEN)
        private readonly hashingService: IHashingService,
    ) { }

    execute(documentId: number): Promise<IntegrityStatusEnum> {
        const document = this.documentRepo.getById(documentId);
        if (!document) {
            throw new Error(`Document with id ${documentId} not found`);
        }

        if (document.getId() === null) {
            throw new Error(`Document has not been saved yet, cannot check integrity`);
        }

        return this.hashingService.checkDocumentIntegrity(document.getId() as number)
    }
}
