import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
    app:   { isPackaged: false },
    shell: { openPath: vi.fn() },
}));

vi.mock('tsyringe', () => ({
    container: { resolve: vi.fn() },
    injectable: () => () => {},
    inject:     () => () => {},
}));

import { shell } from 'electron';
import { container } from 'tsyringe';
import { FileViewerIpcAdapter } from '../../../src/ipc/FileViewerIpcAdapter';
import { IpcChannels } from '../../../../shared/ipc-channels';
import { ExportResult } from '../../../src/value-objects/ExportResult';
import { PrintResult } from '../../../src/value-objects/PrintResult';

// Costruisce un ipcMain mock con handle registrabile e invocabile
const makeIpcMain = () => {
    const handlers = new Map<string, Function>();
    return {
        handle: vi.fn((channel: string, handler: Function) => {
            handlers.set(channel, handler);
        }),
        invoke: async (channel: string, ...args: unknown[]) => {
            const handler = handlers.get(channel);
            if (!handler) throw new Error(`Handler non registrato: ${channel}`);
            return handler({} /* _event */, ...args);
        },
    };
};

describe('FileViewerIpcAdapter', () => {
    let ipcMain:      ReturnType<typeof makeIpcMain>;
    let exportFileUC: { execute: ReturnType<typeof vi.fn> };
    let printFileUC:  { execute: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        ipcMain = makeIpcMain();
        vi.clearAllMocks();

        exportFileUC = { execute: vi.fn() };
        printFileUC  = { execute: vi.fn() };

        (container.resolve as ReturnType<typeof vi.fn>)
            .mockReturnValueOnce(exportFileUC)
            .mockReturnValueOnce(printFileUC);

        FileViewerIpcAdapter.register(ipcMain as any);
    });

    // ─── Registrazione handler ────────────────────────────────────────────────

    it('registra tutti i channel IPC attesi', () => {
        const registeredChannels = (ipcMain.handle as ReturnType<typeof vi.fn>)
            .mock.calls.map((call: unknown[]) => call[0]);

        expect(registeredChannels).toContain(IpcChannels.FILE_OPEN_EXTERNAL);
        expect(registeredChannels).toContain(IpcChannels.FILE_DOWNLOAD);
        expect(registeredChannels).toContain(IpcChannels.FILE_PRINT);
    });

    // ─── FILE_OPEN_EXTERNAL ───────────────────────────────────────────────────

    it('FILE_OPEN_EXTERNAL ritorna success true se shell.openPath ha successo', async () => {
        (shell.openPath as ReturnType<typeof vi.fn>).mockResolvedValue('');

        const result = await ipcMain.invoke(IpcChannels.FILE_OPEN_EXTERNAL, '/path/to/file.pdf');

        expect(shell.openPath).toHaveBeenCalledWith('/path/to/file.pdf');
        expect(result).toEqual({ success: true });
    });

    it('FILE_OPEN_EXTERNAL ritorna success false se shell.openPath ritorna errore', async () => {
        (shell.openPath as ReturnType<typeof vi.fn>).mockResolvedValue('Applicazione non trovata');

        const result = await ipcMain.invoke(IpcChannels.FILE_OPEN_EXTERNAL, '/path/to/file.pdf');

        expect(result).toEqual({ success: false });
    });

    it('FILE_OPEN_EXTERNAL propaga eccezioni di shell.openPath', async () => {
        (shell.openPath as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('shell crashed'));

        await expect(
            ipcMain.invoke(IpcChannels.FILE_OPEN_EXTERNAL, '/path/to/file.pdf')
        ).rejects.toThrow('shell crashed');
    });

    // ─── FILE_DOWNLOAD ────────────────────────────────────────────────────────

    it('FILE_DOWNLOAD chiama exportFileUC.execute con fileId e targetPath', async () => {
        exportFileUC.execute.mockResolvedValue(ExportResult.ok());

        await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, 1, '/dest/file.pdf');

        expect(exportFileUC.execute).toHaveBeenCalledWith(1, '/dest/file.pdf');
    });

    it('FILE_DOWNLOAD ritorna ExportResult.ok() se l\'esportazione riesce', async () => {
        exportFileUC.execute.mockResolvedValue(ExportResult.ok());

        const result = await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, 1, '/dest/file.pdf');

        expect(result.success).toBe(true);
    });

    it('FILE_DOWNLOAD ritorna ExportResult.fail() se il file non esiste', async () => {
        exportFileUC.execute.mockResolvedValue(ExportResult.fail('NOT_FOUND', 'File non trovato'));

        const result = await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, 99, '/dest/file.pdf');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('FILE_DOWNLOAD ritorna ExportResult.fail() se la scrittura fallisce', async () => {
        exportFileUC.execute.mockResolvedValue(ExportResult.fail('WRITE_ERROR', 'Permesso negato'));

        const result = await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, 1, '/dest/protetto/file.pdf');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('WRITE_ERROR');
    });

    it('FILE_DOWNLOAD propaga eccezioni di exportFileUC.execute', async () => {
        exportFileUC.execute.mockRejectedValue(new Error('export exploded'));

        await expect(
            ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, 1, '/dest/file.pdf')
        ).rejects.toThrow('export exploded');
    });

    // ─── FILE_PRINT ───────────────────────────────────────────────────────────

    it('FILE_PRINT chiama printFileUC.execute con il fileId', async () => {
        printFileUC.execute.mockResolvedValue(PrintResult.ok());

        await ipcMain.invoke(IpcChannels.FILE_PRINT, 1);

        expect(printFileUC.execute).toHaveBeenCalledWith(1);
    });

    it('FILE_PRINT ritorna PrintResult.ok() se la stampa riesce', async () => {
        printFileUC.execute.mockResolvedValue(PrintResult.ok());

        const result = await ipcMain.invoke(IpcChannels.FILE_PRINT, 1);

        expect(result.success).toBe(true);
    });

    it('FILE_PRINT ritorna PrintResult.fail() se il file non esiste', async () => {
        printFileUC.execute.mockResolvedValue(PrintResult.fail('NOT_FOUND', 'File non trovato'));

        const result = await ipcMain.invoke(IpcChannels.FILE_PRINT, 99);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('FILE_PRINT ritorna PrintResult.fail() se shell.openPath fallisce', async () => {
        printFileUC.execute.mockResolvedValue(PrintResult.fail('SHELL_ERROR', 'Applicazione non trovata'));

        const result = await ipcMain.invoke(IpcChannels.FILE_PRINT, 1);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('SHELL_ERROR');
    });

    it('FILE_PRINT propaga eccezioni di printFileUC.execute', async () => {
        printFileUC.execute.mockRejectedValue(new Error('print exploded'));

        await expect(
            ipcMain.invoke(IpcChannels.FILE_PRINT, 1)
        ).rejects.toThrow('print exploded');
    });
});