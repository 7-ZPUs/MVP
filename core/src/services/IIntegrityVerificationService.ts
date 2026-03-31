import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const INTEGRITY_VERIFICATION_SERVICE_TOKEN = Symbol(
  "IIntegrityVerificationService",
);

export interface IIntegrityVerificationService {
  checkFileIntegrityStatus(fileId: number): Promise<IntegrityStatusEnum>;
  checkDocumentIntegrityStatus(documentId: number): Promise<IntegrityStatusEnum>;
  checkProcessIntegrityStatus(processId: number): Promise<IntegrityStatusEnum>;
  checkDocumentClassIntegrityStatus(documentClassId: number): Promise<IntegrityStatusEnum>;
  checkDipIntegrityStatus(dipId: number): Promise<IntegrityStatusEnum>;
}