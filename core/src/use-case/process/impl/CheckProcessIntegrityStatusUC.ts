import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { ICheckProcessIntegrityStatusUC } from '../ICheckProcessIntegrityStatusUC';
import {
    IIntegrityVerificationService,
    INTEGRITY_VERIFICATION_SERVICE_TOKEN,
} from '../../../services/IIntegrityVerificationService';

@injectable()
export class CheckProcessIntegrityStatusUC implements ICheckProcessIntegrityStatusUC {
    constructor(
        @inject(INTEGRITY_VERIFICATION_SERVICE_TOKEN)
        private readonly integrityVerificationService: IIntegrityVerificationService,
    ) {}

    execute(processId: number): Promise<IntegrityStatusEnum> {
        return this.integrityVerificationService.checkProcessIntegrityStatus(
            processId,
        );
    }
}
