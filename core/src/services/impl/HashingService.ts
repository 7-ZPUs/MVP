import { inject, injectable } from "tsyringe";
import { createHash } from "node:crypto";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { IHashingService } from "../IHashingService";
import {
  IPackageReaderPort,
  PACKAGE_READER_PORT_TOKEN,
} from "../../repo/IPackageReaderPort";

@injectable()
export class HashingService implements IHashingService {
  constructor(
    @inject(PACKAGE_READER_PORT_TOKEN)
    private readonly packageReader: IPackageReaderPort,
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
    const byteStream = await this.packageReader.readFileBytes(filePath);
    const hash = createHash("sha256");

    for await (const chunk of byteStream) {
      hash.update(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return hash.digest("base64");
  }
}
