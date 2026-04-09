import { IpcMain, shell, app, dialog, BrowserWindow, WebContentsPrintOptions } from 'electron';
import { container } from 'tsyringe';
import * as path from 'node:path';
import { IpcChannels } from '../../../shared/ipc-channels';
import type { IExportFileUC } from '../use-case/file/IExportFileUC';
import { FileUC } from '../use-case/file/tokens';
import type { IPrintFileUC } from '../use-case/file/IPrintFileUC';

export class FileViewerIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const exportFileUC: IExportFileUC = container.resolve<IExportFileUC>(FileUC.EXPORT_FILE);
        const printFileUC: IPrintFileUC = container.resolve<IPrintFileUC>(FileUC.PRINT_FILE);

        ipcMain.handle(IpcChannels.FILE_PRINT, async (_event, fileId: number) => {
            return printFileUC.execute(fileId);
        });

        ipcMain.handle(IpcChannels.FILE_PRINT_MANY, async (event, fileIds: number[]) => {
            const { response } = await dialog.showMessageBox({
                type: 'question',
                buttons: ['Stampa', 'Annulla'],
                defaultId: 0,
                cancelId: 1,
                title: 'Conferma stampa',
                message: `Stai per stampare ${fileIds.length} document${fileIds.length === 1 ? 'o' : 'i'}.`,
                detail: `Attenzione che proseguendo verr${fileIds.length === 1 ? 'à' : 'anno'} aperte ${fileIds.length} finestr${fileIds.length === 1 ? 'a' : 'e'} di stampa.
                Vuoi continuare?`,
            });

            if (response === 1) return { canceled: true, results: [] };

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