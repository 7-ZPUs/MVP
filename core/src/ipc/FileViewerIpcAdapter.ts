import { IpcMain, shell } from 'electron';
import { container } from 'tsyringe';
import { dialog } from 'electron'; // aggiunto

import { IpcChannels } from '../../../shared/ipc-channels';
import type { IExportFileUC } from '../use-case/file/IExportFileUC';
import { FileUC }             from '../use-case/file/tokens';

export class FileViewerIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const exportFileUC: IExportFileUC = container.resolve<IExportFileUC>(FileUC.EXPORT_FILE);

        // non ha UC dedicati, perché è una semplice operazione di sistema che non coinvolge la logica di dominio
        ipcMain.handle(IpcChannels.FILE_OPEN_EXTERNAL, async (_event, filePath: string) => {
            const error = await shell.openPath(filePath);
            return { success: error === '' };
        });

        ipcMain.handle(IpcChannels.FILE_SAVE_DIALOG, async (_event, defaultName?: string) => {
            const result = await dialog.showSaveDialog({
                defaultPath: defaultName,
                filters: [{ name: 'All Files', extensions: ['*'] }],
            });
            return { canceled: result.canceled, filePath: result.filePath };
        });

        ipcMain.handle(
            IpcChannels.FILE_DOWNLOAD,
            (_event, fileId: number, targetPath: string) => {
                return exportFileUC.execute(fileId, targetPath);
            }
        );
    }
}