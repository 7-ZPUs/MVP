import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const HASHING_SERVICE_TOKEN = Symbol("IHashingService");

export interface IHashingService {
  checkDipIntegrity(
    id: number,
  ): Promise<IntegrityStatusEnum>;
  checkDocumentClassIntegrity(
    id: number,
  ): Promise<IntegrityStatusEnum>;
  checkProcessIntegrity(
    id: number,
  ): Promise<IntegrityStatusEnum>;
  checkDocumentIntegrity(
    id: number,
  ): Promise<IntegrityStatusEnum>;
  checkFileIntegrity(
    filePath: string,
    expectedHash: string,
  ): Promise<IntegrityStatusEnum>;
}
