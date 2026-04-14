import { IpcMain } from "electron";
import { container } from "tsyringe";
import { IpcChannels } from "../../../shared/ipc-channels";
import type { IExportFileUC } from "../use-case/file/IExportFileUC";
import type { IPrintFileUC } from "../use-case/file/IPrintFileUC";
import type { IDialogPort } from "../repo/IDialogPort";
import { FileUC } from "../use-case/file/tokens";
import { DIALOG_PORT_TOKEN } from "../repo/IDialogPort";

export class FileViewerIpcAdapter {
  static register(ipcMain: IpcMain): void {
    const exportFileUC = container.resolve<IExportFileUC>(FileUC.EXPORT_FILE);
    const printFileUC  = container.resolve<IPrintFileUC>(FileUC.PRINT_FILE);
    const dialogPort   = container.resolve<IDialogPort>(DIALOG_PORT_TOKEN);

    ipcMain.handle(IpcChannels.FILE_PRINT, (_event, fileId: number) =>
      printFileUC.execute(fileId)
    );

    ipcMain.handle(IpcChannels.FILE_PRINT_MANY, async (event, fileIds: number[]) => {
      const { confirmed } = await dialogPort.showConfirmPrint(fileIds.length);
      if (!confirmed) return { canceled: true, results: [] };
      const results = [];
      for (let i = 0; i < fileIds.length; i++) {
        event.sender.send(IpcChannels.FILE_PRINT_PROGRESS, {
          current: i + 1,
          total: fileIds.length,
        });
        const outcome = await printFileUC.execute(fileIds[i]);
        results.push({ fileId: fileIds[i], ...outcome });
      }
      return { canceled: false, results };
    });

    ipcMain.handle(IpcChannels.FILE_SAVE_DIALOG, (_event, defaultName?: string) =>
      dialogPort.showSaveDialog({ defaultName })
    );

    ipcMain.handle(IpcChannels.FILE_FOLDER_DIALOG, () =>
      dialogPort.showFolderDialog()
    );

    ipcMain.handle(
      IpcChannels.FILE_DOWNLOAD,
      (_event, { fileId, destPath }: { fileId: number; destPath: string }) =>
        exportFileUC.execute(fileId, destPath)
    );
  }
}