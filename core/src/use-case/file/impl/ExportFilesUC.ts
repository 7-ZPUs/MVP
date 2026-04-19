import { inject, injectable } from "tsyringe";
import { IExportFilesUC } from "../IExportFilesUC";
import {
  FILE_GET_BY_ID_PORT_TOKEN,
  IGetFileByIdPort,
} from "../../../repo/IFileRepository";
import { EXPORT_TOKEN, IExportPort } from "../../../repo/IExportPort";
import {
  FILE_SYSTEM_PROVIDER_TOKEN,
  IFileSystemPort,
} from "../../../repo/impl/utils/IFileSystemProvider";
import { IDialogPort, DIALOG_PORT_TOKEN } from "../../../repo/IDialogPort";
import { ExportFileResults } from "../../../../../shared/domain/ExportFileResults";
import { ExportResult } from "../../../../../shared/domain/ExportResult";
import * as path from "node:path";

@injectable()
export class ExportFilesUC implements IExportFilesUC {
  constructor(
    @inject(FILE_GET_BY_ID_PORT_TOKEN)
    private readonly fileRepo: IGetFileByIdPort,
    @inject(EXPORT_TOKEN)
    private readonly exportPort: IExportPort,
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemPort,
    @inject(DIALOG_PORT_TOKEN)
    private readonly dialogPort: IDialogPort,
    @inject("DIP_PATH_TOKEN")
    private readonly dipPath: string,
  ) { }

  async execute( fileIds: number[], onProgress: (current: number, total: number) => void, ): Promise<ExportFileResults> {
    const dialog = await this.dialogPort.showFolderDialog();
    if (dialog.canceled || !dialog.folderPath) {
      return { canceled: true, results: [] };
    }

    const results: { fileId: number; exportResult: ExportResult }[] = [];

    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const file = this.fileRepo.getById(fileId);

      if (!file) {
        results.push({ fileId, exportResult : ExportResult.fail("NOT_FOUND",`File ${fileId} non trovato`)});
        onProgress(i + 1, fileIds.length);
        continue;
      }

      const filename = path.basename(file.getPath());
      const destPath = path.join(dialog.folderPath, filename);
      const absolutePath = path.resolve(this.dipPath, file.getPath());

      const outcome = await this.exportPort.exportFile( await this.fileSystemProvider.openReadStream(absolutePath), destPath, );

      results.push({ fileId, exportResult : outcome});
      onProgress(i + 1, fileIds.length);
    }

    return { canceled: false, results };
  }
}
