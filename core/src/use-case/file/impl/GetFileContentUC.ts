import { inject, injectable } from "tsyringe";
import {
  IPackageReaderService,
  PACKAGE_READER_PORT_TOKEN,
} from "../../../services/IPackageReaderService";
import {
  FILE_REPOSITORY_TOKEN,
  IFileRepository,
} from "../../../repo/IFileRepository";
import { IGetFileContentUC } from "../IGetFileContentUC";
import { FILE_SYSTEM_PROVIDER_TOKEN, IFileSystemPort } from "../../../repo/impl/utils/IFileSystemProvider";

@injectable()
export class GetFileContentUC implements IGetFileContentUC {
  constructor(
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemPort,
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepo: IFileRepository,
  ) {}

  async execute(fileId: number): Promise<Buffer> {
    console.log("GetFileContentUC: executing with fileId =", fileId);
    let filePath = this.fileRepo.getById(fileId)?.getPath();
    if (!filePath) {
      throw new Error(`File with id ${fileId} not found`);
    }
    let result = await this.fileSystemProvider.openReadStream(filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of result) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }
}
