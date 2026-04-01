import { inject, injectable } from 'tsyringe';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';
import type { ICheckDipIntegrityStatusUC } from '../ICheckDipIntegrityStatusUC';
import {
    IIntegrityVerificationService,
    INTEGRITY_VERIFICATION_SERVICE_TOKEN,
} from '../../../services/IIntegrityVerificationService';

@injectable()
export class CheckDipIntegrityStatusUC implements ICheckDipIntegrityStatusUC {
    constructor(
        @inject(INTEGRITY_VERIFICATION_SERVICE_TOKEN)
        private readonly integrityVerificationService: IIntegrityVerificationService,
    ) {}

    execute(dipId: number): Promise<IntegrityStatusEnum> {
        return this.integrityVerificationService.checkDipIntegrityStatus(dipId);
    }
}
