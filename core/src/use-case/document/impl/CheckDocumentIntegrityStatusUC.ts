import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { ICheckDocumentIntegrityStatusUC } from '../ICheckDocumentIntegrityStatusUC';
import {
    IIntegrityVerificationService,
    INTEGRITY_VERIFICATION_SERVICE_TOKEN,
} from '../../../services/IIntegrityVerificationService';

@injectable()
export class CheckDocumentIntegrityStatusUC implements ICheckDocumentIntegrityStatusUC {
    constructor(
        @inject(INTEGRITY_VERIFICATION_SERVICE_TOKEN)
        private readonly integrityVerificationService: IIntegrityVerificationService,
    ) {}

    execute(documentId: number): Promise<IntegrityStatusEnum> {
        return this.integrityVerificationService.checkDocumentIntegrityStatus(
            documentId,
        );
    }
}
