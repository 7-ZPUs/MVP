import { inject, injectable } from "tsyringe";
import { createHash } from "node:crypto";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { IHashingService } from "../IHashingService";
import {
  IPackageReaderService,
  PACKAGE_READER_PORT_TOKEN,
} from "../IPackageReaderService";
import { FILE_SYSTEM_PROVIDER_TOKEN, IFileSystemPort } from "../../repo/impl/utils/IFileSystemProvider";

@injectable()
export class HashingService implements IHashingService {
  constructor(
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemPort
  ) {}

  async checkFileIntegrity(
    filePath: string,
    expectedHash: string,
  ): Promise<IntegrityStatusEnum> {
    const calculatedHash = await this.checkHash(filePath);
    return calculatedHash === expectedHash
      ? IntegrityStatusEnum.VALID
      : IntegrityStatusEnum.INVALID;
  }

  private async checkHash(filePath: string): Promise<string> {
    try {
      const byteStream = await this.fileSystemProvider.openReadStream(filePath);
      const hash = createHash("sha256");

      for await (const chunk of byteStream) {
        hash.update(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      return hash.digest("base64");
    } catch (err) {
      return "";
    }
  }
}
