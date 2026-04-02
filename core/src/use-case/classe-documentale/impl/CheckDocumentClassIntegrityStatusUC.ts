import { inject, injectable } from "tsyringe";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import type { ICheckDocumentClassIntegrityStatusUC } from "../ICheckDocumentClassIntegrityStatusUC";
import {
  IIntegrityVerificationService,
  INTEGRITY_VERIFICATION_SERVICE_TOKEN,
} from "../../../services/IIntegrityVerificationService";

@injectable()
export class CheckDocumentClassIntegrityStatusUC implements ICheckDocumentClassIntegrityStatusUC {
  constructor(
    @inject(INTEGRITY_VERIFICATION_SERVICE_TOKEN)
    private readonly integrityVerificationService: IIntegrityVerificationService,
  ) {}

  execute(documentClassId: number): Promise<IntegrityStatusEnum> {
    return this.integrityVerificationService.checkDocumentClassIntegrityStatus(
      documentClassId,
    );
  }
}
