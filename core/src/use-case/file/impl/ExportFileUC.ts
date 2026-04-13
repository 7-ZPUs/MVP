import { inject, injectable } from "tsyringe";
import { IExportFileUC } from "../IExportFileUC";
import {
  IFileRepository,
  FILE_REPOSITORY_TOKEN,
} from "../../../repo/IFileRepository";
import { ExportResult } from "../../../../../shared/domain/ExportResult";
import { EXPORT_TOKEN, IExportPort } from "../../../repo/IExportPort";
import { FILE_SYSTEM_PROVIDER_TOKEN, IFileSystemPort } from "../../../repo/impl/utils/IFileSystemProvider";

@injectable()
export class ExportFileUC implements IExportFileUC {
  constructor(
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepo: IFileRepository,
    @inject(EXPORT_TOKEN)
    private readonly exportPort: IExportPort,
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemPort,
    @inject("DIP_PATH_TOKEN")
    private readonly dipPath: string,
  ) {}

  async execute(fileId: number, targetPath: string): Promise<ExportResult> {
    const file = this.fileRepo.getById(fileId);
    if (!file) {
      return ExportResult.fail(
        "NOT_FOUND",
        `File con id ${fileId} non trovato`,
      );
    }
    const path = require("path");
    const absolutePath = path.resolve(this.dipPath, file.getPath());
    return this.exportPort.exportFile(
      await this.fileSystemProvider.openReadStream(absolutePath),
      targetPath,
    );
  }
}
