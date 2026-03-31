import { inject } from "tsyringe";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { IHashingService } from "../IHashingService";
import {
  IPackageReaderPort,
  PACKAGE_READER_PORT_TOKEN,
} from "../../repo/IPackageReaderPort";
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  IDocumentRepository,
} from "../../repo/IDocumentRepository";
import {
  IProcessRepository,
  PROCESS_REPOSITORY_TOKEN,
} from "../../repo/IProcessRepository";
import {
  DOCUMENT_CLASS_REPOSITORY_TOKEN,
  IDocumentClassRepository,
} from "../../repo/IDocumentClassRepository";
import {
  FILE_REPOSITORY_TOKEN,
  IFileRepository,
} from "../../repo/IFileRepository";

class HashingService implements IHashingService {
  constructor(
    @inject(PACKAGE_READER_PORT_TOKEN)
    private readonly packageReader: IPackageReaderPort,
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepo: IFileRepository,
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
    @inject(PROCESS_REPOSITORY_TOKEN)
    private readonly processRepo: IProcessRepository,
    @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
    private readonly documentClassRepo: IDocumentClassRepository,
  ) { }

  async checkFileIntegrity(
    filePath: string,
    expectedHash: string,
  ): Promise<IntegrityStatusEnum> {
    const calculatedHash = await this.checkHash(filePath, expectedHash);
    return calculatedHash === expectedHash
      ? IntegrityStatusEnum.VALID
      : IntegrityStatusEnum.INVALID;
  }

  async checkDocumentIntegrity(id: number): Promise<IntegrityStatusEnum> {
    const files = this.fileRepo.getByDocumentId(id);
    if (files.length === 0) {
      return IntegrityStatusEnum.UNKNOWN;
    }
    const results = await Promise.all(
      files.map((file) =>
        this.checkFileIntegrity(file.getPath(), file.getHash()),
      ),
    );
    const is_invalid = results.includes(IntegrityStatusEnum.INVALID);
    return is_invalid ? IntegrityStatusEnum.INVALID : IntegrityStatusEnum.VALID;
  }

  async checkProcessIntegrity(id: number): Promise<IntegrityStatusEnum> {
    const processes = this.documentRepo.getByProcessId(id);
    if (processes.length === 0) {
      return IntegrityStatusEnum.UNKNOWN;
    }
    const results = await Promise.all(
      processes.map((document) =>
        this.checkDocumentIntegrity(document.getId() as number),
      ),
    );
    const is_invalid = results.includes(IntegrityStatusEnum.INVALID);
    return is_invalid ? IntegrityStatusEnum.INVALID : IntegrityStatusEnum.VALID;
  }

  async checkDocumentClassIntegrity(id: number): Promise<IntegrityStatusEnum> {
    const process = this.processRepo.getByDocumentClassId(id);
    if (process.length === 0) {
      return IntegrityStatusEnum.UNKNOWN;
    }
    const results = await Promise.all(
      process.map((process) =>
        this.checkProcessIntegrity(process.getId() as number),
      ),
    );
    const is_invalid = results.includes(IntegrityStatusEnum.INVALID);
    return is_invalid ? IntegrityStatusEnum.INVALID : IntegrityStatusEnum.VALID;
  }

  async checkDipIntegrity(id: number): Promise<IntegrityStatusEnum> {
    const documentClasses = this.documentClassRepo.getByDipId(id);
    if (documentClasses.length === 0) {
      return IntegrityStatusEnum.UNKNOWN;
    }
    const results = await Promise.all(
      documentClasses.map((dc) =>
        this.checkProcessIntegrity(dc.getId() as number),
      ),
    );
    const is_invalid = results.includes(IntegrityStatusEnum.INVALID);
    return is_invalid ? IntegrityStatusEnum.INVALID : IntegrityStatusEnum.VALID;
  }

  async checkHash(filePath: string, expected: string): Promise<string> {
    const byteStream = await this.packageReader.readFileBytes(filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of byteStream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const arrayBuffer = Buffer.concat(chunks).buffer;

    const calculatedHash = await this.calculateHash(arrayBuffer);

    return calculatedHash;
  }

  async calculateHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    let binaryString = "";
    for (const element of hashArray) {
      binaryString += String.fromCodePoint(element);
    }

    return btoa(binaryString);
  }
}
