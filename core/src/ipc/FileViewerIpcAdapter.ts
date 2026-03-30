import { IpcMain, shell } from 'electron';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';
import type { IExportFileUC } from '../use-case/file/IExportFileUC';
import type { IPrintFileUC }  from '../use-case/file/IPrintFileUC';
import { FileUC }             from '../use-case/file/tokens';

export class FileViewerIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const exportFileUC = container.resolve<IExportFileUC>(FileUC.EXPORT_FILE);
        const printFileUC  = container.resolve<IPrintFileUC>(FileUC.PRINT_FILE);

        // non ha UC dedicati, perché è una semplice operazione di sistema che non coinvolge la logica di dominio
        ipcMain.handle(IpcChannels.FILE_OPEN_EXTERNAL, async (_event, filePath: string) => {
            const error = await shell.openPath(filePath);
            return { success: error === '' };
        });

        ipcMain.handle(
            IpcChannels.FILE_DOWNLOAD,
            (_event, fileId: number, targetPath: string) => {
                return exportFileUC.execute(fileId, targetPath);
            }
        );

        ipcMain.handle(
            IpcChannels.FILE_PRINT,
            (_event, fileId: number) => {
                return printFileUC.execute(fileId);
            }
        );
    }
}