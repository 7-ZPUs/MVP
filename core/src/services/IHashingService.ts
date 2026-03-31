import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const HASHING_SERVICE_TOKEN = Symbol("IHashingService");

export interface IHashingService {
  checkFileIntegrity(
    filePath: string,
    expectedHash: string,
  ): Promise<IntegrityStatusEnum>;
}
