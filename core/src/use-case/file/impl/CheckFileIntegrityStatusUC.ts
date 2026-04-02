import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import {
    IIntegrityVerificationService,
    INTEGRITY_VERIFICATION_SERVICE_TOKEN,
} from '../../../services/IIntegrityVerificationService';
import type { ICheckFileIntegrityStatusUC } from '../ICheckFileIntegrityStatusUC';

@injectable()
export class CheckFileIntegrityStatusUC implements ICheckFileIntegrityStatusUC {
    constructor(
        @inject(INTEGRITY_VERIFICATION_SERVICE_TOKEN)
        private readonly integrityVerificationService: IIntegrityVerificationService,
    ) {}

    execute(fileId: number): Promise<IntegrityStatusEnum> {
        return this.integrityVerificationService.checkFileIntegrityStatus(fileId);
    }
}
