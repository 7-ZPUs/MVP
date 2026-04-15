import { IpcMain, WebContents } from "electron";
import { container } from "tsyringe";
import { IpcChannels } from "../../../shared/ipc-channels";
import type { IExportFileUC } from "../use-case/file/IExportFileUC";
import type { IExportFilesUC } from "../use-case/file/IExportFilesUC";
import type { IPrintFileUC } from "../use-case/file/IPrintFileUC";
import { FileUC } from "../use-case/file/tokens";
import { IPrintFilesUC } from "../use-case/file/IPrintFilesUC";

export class FileViewerIpcAdapter {
  static register(ipcMain: IpcMain): void {
    const exportFileUC  = container.resolve<IExportFileUC>(FileUC.EXPORT_FILE);
    const exportFilesUC = container.resolve<IExportFilesUC>(FileUC.EXPORT_FILES);
    const printFileUC   = container.resolve<IPrintFileUC>(FileUC.PRINT_FILE);
    const printFilesUC = container.resolve<IPrintFilesUC>(FileUC.PRINT_FILES)

    ipcMain.handle(IpcChannels.FILE_DOWNLOAD, (_event, fileId: number) =>
      exportFileUC.execute(fileId)
    );

    ipcMain.handle(IpcChannels.FILE_DOWNLOAD_MANY, (event, fileIds: number[]) =>
      exportFilesUC.execute(fileIds, (current, total) => {
        event.sender.send(IpcChannels.FILE_DOWNLOAD_PROGRESS, { current, total });
      })
    );

    ipcMain.handle(IpcChannels.FILE_PRINT, (_event, fileId: number) =>
      printFileUC.execute(fileId)
    );

    ipcMain.handle(IpcChannels.FILE_PRINT_MANY, (event, fileIds: number[]) =>
      printFilesUC.execute(fileIds, (current, total) => {
        event.sender.send(IpcChannels.FILE_PRINT_PROGRESS, { current, total });
      })
    );
  }
}