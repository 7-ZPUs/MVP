import { inject, injectable } from 'tsyringe';
import { IPrintFileUC } from '../IPrintFileUC';
import { IFileRepository, FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import { BrowserWindow, WebContentsPrintOptions } from 'electron';

@injectable()
export class PrintFileUC implements IPrintFileUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository,
        @inject("DIP_PATH_TOKEN")
        private readonly dipPath: string
    ) { }

    private printSingle( absolutePath: string, opts: WebContentsPrintOptions ): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            // Crea una finestra nascosta
            const win = new BrowserWindow({
                show: false,
                webPreferences: {
                    plugins: true, // necessario per la stampa di PDF e altri formati
                },
            });

            // Carica il file usando il protocollo file:// di Electron.
            win.loadURL(`file://${absolutePath}`);

            // Evento emesso quando il documento è stato caricato e renderizzato correttamente
            win.webContents.once('did-finish-load', () => {
                win.webContents.print(opts, (success, failureReason) => {
                    // Distruggi sempre la finestra dopo la stampa per liberare le risorse
                    win.destroy();

                    if (success) {
                        resolve({ success: true });
                    } else {
                        resolve({ success: false, error: failureReason });
                    }
                });
            });

            // Evento emesso se il caricamento del file fallisce
            win.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
                win.destroy();
                resolve({
                    success: false,
                    error: `did-fail-load: ${errorDescription} (codice: ${errorCode})`
                });
            });
        });
    }



    async execute(fileId: number): Promise<{ success: boolean; error?: string }> {
        const file = this.fileRepo.getById(fileId);
        if (!file) {
            return { success: false, error: `File con id ${fileId} non trovato` };
        }

        const path = require('node:path');
        const absolutePath = path.resolve(this.dipPath, file.getPath());
        return this.printSingle(absolutePath, { silent: true, printBackground: true });
    }
}