import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';
import { CheckIntegrityIpcAdapter } from '../../src/ipc/CheckIntegrityIpcAdapter';
import { IntegrityStatusEnum } from '../../src/value-objects/IntegrityStatusEnum';
import { FileUC } from '../../src/use-case/file/tokens';
import { DocumentoUC } from '../../src/use-case/document/tokens';
import { ProcessUC } from '../../src/use-case/process/token';
import { DocumentClassUC } from '../../src/use-case/classe-documentale/tokens';
import { DipUC } from '../../src/use-case/dip/token';
import { CheckFileIntegrityStatusUC } from '../../src/use-case/file/impl/CheckFileIntegrityStatusUC';
import { CheckDocumentIntegrityStatusUC } from '../../src/use-case/document/impl/CheckDocumentIntegrityStatusUC';
import { CheckProcessIntegrityStatusUC } from '../../src/use-case/process/impl/CheckProcessIntegrityStatusUC';
import { CheckDocumentClassIntegrityStatusUC } from '../../src/use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC';
import { CheckDipIntegrityStatusUC } from '../../src/use-case/dip/impl/CheckDipIntegrityStatusUC';
import { CryptoHashingService } from '../../src/services/impl/CryptoHashingService';
import { File } from '../../src/entity/File';
import {
    createIntegrationContext,
    disposeIntegrationContext,
    seedBaseGraph,
    FakeIpcMain,
    type IntegrationContext,
    type SeededGraph,
} from '../helpers/integrationContext';

describe('CheckIntegrityIpcAdapter integration', () => {
    let context: IntegrationContext;
    let seeded: SeededGraph;
    let ipcMain: FakeIpcMain;
    let hashingService: CryptoHashingService;
    let validHash: string;
    let invalidFileId: number;
    let noHashFileId: number;
    let missingFileId: number;

    beforeAll(async () => {
        context = await createIntegrationContext('check-integrity-ipc-it-');

        await fs.writeFile(path.join(context.tempDir, 'main.txt'), 'main-content', 'utf-8');
        await fs.writeFile(path.join(context.tempDir, 'attachment.txt'), 'attachment-content', 'utf-8');
        await fs.writeFile(path.join(context.tempDir, 'second.txt'), 'second-content', 'utf-8');

        seeded = seedBaseGraph(context, context.tempDir);
        hashingService = new CryptoHashingService();

        const mainBuffer = await fs.readFile(path.join(context.tempDir, 'main.txt'));
        const mainArrayBuffer = mainBuffer.buffer.slice(
            mainBuffer.byteOffset,
            mainBuffer.byteOffset + mainBuffer.byteLength,
        );
        validHash = await hashingService.calcolaHash(mainArrayBuffer);

        context.db
            .prepare('UPDATE file SET hash = ? WHERE id = ?')
            .run(validHash, seeded.mainFileId);
        context.db
            .prepare('UPDATE file SET hash = ? WHERE id = ?')
            .run('hash-not-matching', seeded.attachmentFileId);
        invalidFileId = seeded.attachmentFileId;

        const noHashFile = context.fileRepository.save(
            new File('nohash.txt', path.join(context.tempDir, 'nohash.txt'), '', false, seeded.secondDocumentId),
        );
        await fs.writeFile(path.join(context.tempDir, 'nohash.txt'), 'no-hash-content', 'utf-8');
        noHashFileId = noHashFile.getId() ?? 0;

        const missingFile = context.fileRepository.save(
            new File('missing.txt', path.join(context.tempDir, 'missing.txt'), 'expected', false, seeded.secondDocumentId),
        );
        missingFileId = missingFile.getId() ?? 0;
    });

    beforeEach(() => {
        container.reset();
        ipcMain = new FakeIpcMain();

        container.registerInstance(
            FileUC.CHECK_INTEGRITY_STATUS,
            new CheckFileIntegrityStatusUC(context.fileRepository, hashingService),
        );
        container.registerInstance(
            DocumentoUC.CHECK_INTEGRITY_STATUS,
            new CheckDocumentIntegrityStatusUC(context.documentRepository, context.fileRepository),
        );
        container.registerInstance(
            ProcessUC.CHECK_INTEGRITY_STATUS,
            new CheckProcessIntegrityStatusUC(context.processRepository, context.documentRepository),
        );
        container.registerInstance(
            DocumentClassUC.CHECK_INTEGRITY_STATUS,
            new CheckDocumentClassIntegrityStatusUC(context.documentClassRepository, context.processRepository),
        );
        container.registerInstance(
            DipUC.CHECK_INTEGRITY_STATUS,
            new CheckDipIntegrityStatusUC(context.dipRepository, context.documentClassRepository),
        );

        CheckIntegrityIpcAdapter.register(ipcMain as never);
    });

    afterAll(async () => {
        container.reset();
        await disposeIntegrationContext(context);
    });

    it('checks file integrity with valid and invalid hashes', async () => {
        const validStatus = await ipcMain.invokeAsync<IntegrityStatusEnum>(
            IpcChannels.CHECK_FILE_INTEGRITY_STATUS,
            seeded.mainFileId,
        );

        const invalidStatus = await ipcMain.invokeAsync<IntegrityStatusEnum>(
            IpcChannels.CHECK_FILE_INTEGRITY_STATUS,
            invalidFileId,
        );

        expect(validStatus).toBe(IntegrityStatusEnum.VALID);
        expect(invalidStatus).toBe(IntegrityStatusEnum.INVALID);
    });

    it('returns UNKNOWN when expected hash is missing and throws for missing file path', async () => {
        const unknownStatus = await ipcMain.invokeAsync<IntegrityStatusEnum>(
            IpcChannels.CHECK_FILE_INTEGRITY_STATUS,
            noHashFileId,
        );

        await expect(
            ipcMain.invokeAsync(IpcChannels.CHECK_FILE_INTEGRITY_STATUS, missingFileId),
        ).rejects.toThrow();

        expect(unknownStatus).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it('propagates aggregated status from file to dip', () => {
        context.fileRepository.updateIntegrityStatus(seeded.mainFileId, IntegrityStatusEnum.VALID);
        context.fileRepository.updateIntegrityStatus(invalidFileId, IntegrityStatusEnum.INVALID);

        const documentStatus = ipcMain.invoke<IntegrityStatusEnum>(
            IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS,
            seeded.documentId,
        );

        context.documentRepository.updateIntegrityStatus(seeded.secondDocumentId, IntegrityStatusEnum.UNKNOWN);

        const processStatus = ipcMain.invoke<IntegrityStatusEnum>(
            IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS,
            seeded.processId,
        );
        const documentClassStatus = ipcMain.invoke<IntegrityStatusEnum>(
            IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS,
            seeded.documentClassId,
        );
        const dipStatus = ipcMain.invoke<IntegrityStatusEnum>(
            IpcChannels.CHECK_DIP_INTEGRITY_STATUS,
            seeded.dipId,
        );

        expect(documentStatus).toBe(IntegrityStatusEnum.INVALID);
        expect(processStatus).toBe(IntegrityStatusEnum.INVALID);
        expect(documentClassStatus).toBe(IntegrityStatusEnum.INVALID);
        expect(dipStatus).toBe(IntegrityStatusEnum.INVALID);
    });
});
