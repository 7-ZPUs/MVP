import { injectable } from 'tsyringe';
import { IPrintPort } from '../IPrintPort';
import { BrowserWindow, WebContentsPrintOptions } from 'electron';
import { ExportResult } from '../../../../shared/domain/ExportResult';

@injectable()
export class PrintPort implements IPrintPort {

    printSingle(absolutePath: string, opts: WebContentsPrintOptions): Promise<ExportResult> {
        return new Promise((resolve) => {
            const win = new BrowserWindow({
                show: false,
                webPreferences: { plugins: true },
            });

            win.loadURL(`file://${absolutePath}`);

            win.webContents.once('did-finish-load', () => {
                win.webContents.print(opts, (success, failureReason) => {
                    win.destroy();
                    resolve(success ? ExportResult.ok() : ExportResult.fail('PRINT_ERROR', failureReason));
                });
            });

            win.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
                win.destroy();
                resolve(ExportResult.fail('LOAD_ERROR', `did-fail-load: ${errorDescription} (codice: ${errorCode})`));
            });
        });
    }
}