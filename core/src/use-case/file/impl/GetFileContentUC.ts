import { inject, injectable } from "tsyringe";
import {
  IPackageReaderService,
  PACKAGE_READER_PORT_TOKEN,
} from "../../../services/IPackageReaderService";
import {
  FILE_GET_BY_ID_PORT_TOKEN,
  IGetFileByIdPort,
} from "../../../repo/IFileRepository";
import { IGetFileContentUC } from "../IGetFileContentUC";
import {
  FILE_SYSTEM_PROVIDER_TOKEN,
  IFileSystemPort,
} from "../../../repo/impl/utils/IFileSystemProvider";

@injectable()
export class GetFileContentUC implements IGetFileContentUC {
  constructor(
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemPort,
    @inject(FILE_GET_BY_ID_PORT_TOKEN)
    private readonly fileRepo: IGetFileByIdPort,
  ) {}

  async execute(fileId: number): Promise<Buffer> {
    console.log("GetFileContentUC: executing with fileId =", fileId);
    let file = this.fileRepo.getById(fileId);
    let filePath = file?.getPath();
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
