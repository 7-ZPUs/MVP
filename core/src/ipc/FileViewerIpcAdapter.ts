import { IpcMain, shell, app, dialog } from 'electron';
import { container } from 'tsyringe';
import * as path from 'node:path';

import { IpcChannels } from '../../../shared/ipc-channels';
import type { IExportFileUC } from '../use-case/file/IExportFileUC';
import { FileUC } from '../use-case/file/tokens';

export class FileViewerIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const exportFileUC: IExportFileUC = container.resolve<IExportFileUC>(FileUC.EXPORT_FILE);

        // non ha UC dedicati, perché è una semplice operazione di sistema che non coinvolge la logica di dominio
        ipcMain.handle(IpcChannels.FILE_OPEN_EXTERNAL, async (_event, filePath: string) => {
            const absolutePath = path.resolve(app.getAppPath()+"/resources/test-dip/", filePath); // DA CORREGGERE QUANDO SI VA IN PRODUZIONE ( SEPLICEMENTE NON SERVE IL PEZZO HARDCODED)
            const error = await shell.openPath(absolutePath);
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
            (_event, { fileId, destPath }: { fileId: number; destPath: string }) => {
                return exportFileUC.execute(fileId, destPath);
            }
        );

        ipcMain.handle(IpcChannels.FILE_FOLDER_DIALOG, async () => {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
            });
            return {
                canceled: result.canceled,
                folderPath: result.filePaths[0] ?? undefined,
            };
        });
    }
}