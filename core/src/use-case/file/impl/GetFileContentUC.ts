import { inject, injectable } from "tsyringe";
import {
  IPackageReaderPort,
  PACKAGE_READER_PORT_TOKEN,
} from "../../../repo/IPackageReaderPort";
import {
  FILE_REPOSITORY_TOKEN,
  IFileRepository,
} from "../../../repo/IFileRepository";
import { IGetFileContentUC } from "../IGetFileContentUC";

@injectable()
export class GetFileContentUC implements IGetFileContentUC {
  constructor(
    @inject(PACKAGE_READER_PORT_TOKEN)
    private readonly packageReader: IPackageReaderPort,
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepo: IFileRepository,
  ) {}

  async execute(fileId: number): Promise<Buffer> {
    console.log("GetFileContentUC: executing with fileId =", fileId);
    let filePath = this.fileRepo.getById(fileId)?.getPath();
    if (!filePath) {
      throw new Error(`File with id ${fileId} not found`);
    }
    let result = await this.packageReader.readFileBytes(filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of result) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }
}
