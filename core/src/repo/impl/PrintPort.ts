import { injectable } from 'tsyringe';
import { IPrintPort } from '../IPrintPort';
import { BrowserWindow, WebContentsPrintOptions } from 'electron';

@injectable()
export class PrintPort implements IPrintPort {

    printSingle( absolutePath: string, opts: WebContentsPrintOptions ): Promise<{ success: boolean; error?: string }> {
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
}