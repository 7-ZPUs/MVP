import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'node:path';
import { ExportFileUC } from '../../../src/use-case/file/impl/ExportFileUC';
import { PrintFileUC } from '../../../src/use-case/file/impl/PrintFileUC';
import { IFileRepository } from '../../../src/repo/IFileRepository';
import { ExportResult } from '../../../src/value-objects/ExportResult';
import { PrintResult } from '../../../src/value-objects/PrintResult';
import { File } from '../../../src/entity/File';

const makeFile = (id: number, filePath: string) =>
    File.fromDB({
        id,
        filename:        path.basename(filePath),
        path:            filePath,
        integrityStatus: 'UNKNOWN',
        isMain:          1,
        documentId:      1,
    });

describe('ExportFileUC', () => {
    let repo: Pick<IFileRepository, 'getById' | 'exportFile'>;

    beforeEach(() => {
        repo = {
            getById:    vi.fn(),
            exportFile: vi.fn(),
        };
    });

    it('esporta il file e ritorna ExportResult.ok()', async () => {
        (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(makeFile(1, '/src/file.pdf'));
        (repo.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(ExportResult.ok());

        const uc = new ExportFileUC(repo as IFileRepository);
        const result = await uc.execute(1, '/dest/file.pdf');

        expect(repo.getById).toHaveBeenCalledWith(1);
        expect(repo.exportFile).toHaveBeenCalledWith('/src/file.pdf', '/dest/file.pdf');
        expect(result.success).toBe(true);
    });

    it('ritorna ExportResult.fail() se il file non esiste', async () => {
        (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(null);

        const uc = new ExportFileUC(repo as IFileRepository);
        const result = await uc.execute(99, '/dest/file.pdf');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBeDefined();
    });

    it('ritorna ExportResult.fail() se il repo lancia errore', async () => {
        (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(makeFile(1, '/src/file.pdf'));
        (repo.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(
            ExportResult.fail('WRITE_ERROR', 'Errore scrittura')
        );

        const uc = new ExportFileUC(repo as IFileRepository);
        const result = await uc.execute(1, '/dest/file.pdf');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('WRITE_ERROR');
    });
});

describe('PrintFileUC', () => {
    let repo: Pick<IFileRepository, 'getById' | 'printFile'>;

    beforeEach(() => {
        repo = {
            getById:   vi.fn(),
            printFile: vi.fn(),
        };
    });

    it('stampa il file e ritorna PrintResult.ok()', async () => {
        (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(makeFile(1, '/src/file.pdf'));
        (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(PrintResult.ok());

        const uc = new PrintFileUC(repo as IFileRepository);
        const result = await uc.execute(1);

        expect(repo.getById).toHaveBeenCalledWith(1);
        expect(repo.printFile).toHaveBeenCalledWith('/src/file.pdf');
        expect(result.success).toBe(true);
    });

    it('ritorna PrintResult.fail() se il file non esiste', async () => {
        (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(null);

        const uc = new PrintFileUC(repo as IFileRepository);
        const result = await uc.execute(99);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBeDefined();
    });

    it('ritorna PrintResult.fail() se shell.openPath fallisce', async () => {
        (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(makeFile(1, '/src/file.pdf'));
        (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(
            PrintResult.fail('SHELL_ERROR', 'Errore apertura')
        );

        const uc = new PrintFileUC(repo as IFileRepository);
        const result = await uc.execute(1);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('SHELL_ERROR');
    });
});