import { inject, injectable } from "tsyringe";
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
    const chunks: Buffer[] = [];
    for await (const chunk of byteStream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const bytes = Buffer.concat(chunks);
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );

    const calculatedHash = await this.calculateHash(arrayBuffer);

    return calculatedHash;
  }

  private async calculateHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    let binaryString = "";
    for (const element of hashArray) {
      binaryString += String.fromCodePoint(element);
    }

    return btoa(binaryString);
  }
}
