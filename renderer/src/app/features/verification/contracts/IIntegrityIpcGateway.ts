import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';

export interface IIntegrityIpcGateway {
  checkDipIntegrity(dipId: number): Promise<IntegrityStatusEnum>;
  checkDocumentClassIntegrity(classId: number): Promise<IntegrityStatusEnum>;
  checkProcessIntegrity(processId: number): Promise<IntegrityStatusEnum>;
  checkDocumentIntegrity(documentId: number): Promise<IntegrityStatusEnum>;
  checkFileIntegrity(fileId: number): Promise<IntegrityStatusEnum>;
}
