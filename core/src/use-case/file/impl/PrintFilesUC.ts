import { inject, injectable } from "tsyringe";
import { IPrintFilesUC } from "../IPrintFilesUC";
import { IFileRepository, FILE_REPOSITORY_TOKEN } from "../../../repo/IFileRepository";
import { IPrintPort, PRINT_PORT_TOKEN } from "../../../repo/IPrintPort";
import { IDialogPort, DIALOG_PORT_TOKEN } from "../../../repo/IDialogPort";
import { ExportFileResults } from "../../../value-objects/ExportFileResults";
import * as path from "node:path";

@injectable()
export class PrintFilesUC implements IPrintFilesUC {
  constructor(
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepo: IFileRepository,
    @inject(PRINT_PORT_TOKEN)
    private readonly printPort: IPrintPort,
    @inject(DIALOG_PORT_TOKEN)
    private readonly dialogPort: IDialogPort,
    @inject("DIP_PATH_TOKEN")
    private readonly dipPath: string,
  ) {}

  async execute(
    fileIds: number[],
    onProgress: (current: number, total: number) => void,
  ): Promise<ExportFileResults> {

    // Il confirm dialog appartiene qui, non nell'adapter
    const { confirmed } = await this.dialogPort.showConfirmPrint(fileIds.length);
    if (!confirmed) {
      return { canceled: true, results: [] };
    }

    const results: { fileId: number; success: boolean; error?: string }[] = [];

    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const file = this.fileRepo.getById(fileId);

      if (!file) {
        results.push({ fileId, success: false, error: `File ${fileId} non trovato` });
        onProgress(i + 1, fileIds.length);
        continue;
      }

      const absolutePath = path.resolve(this.dipPath, file.getPath());
      const outcome = await this.printPort.printSingle(absolutePath, {
        silent: false,
        printBackground: true,
      });

      results.push({
        fileId,
        success: outcome.success,
        error: outcome.errorMessage,
      });

      onProgress(i + 1, fileIds.length);
    }

    return { canceled: false, results };
  }
}