import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';
import { BrowsingIpcAdapter } from '../../src/ipc/BrowsingIpcAdapter';
import { IntegrityStatusEnum } from '../../src/value-objects/IntegrityStatusEnum';
import { DocumentoUC } from '../../src/use-case/document/tokens';
import { FileUC } from '../../src/use-case/file/tokens';
import { ProcessUC } from '../../src/use-case/process/token';
import { DocumentClassUC } from '../../src/use-case/classe-documentale/tokens';
import { DipUC } from '../../src/use-case/dip/token';
import { GetDocumentByIdUC } from '../../src/use-case/document/impl/GetDocumentByIdUC';
import { GetDocumentByProcessUC } from '../../src/use-case/document/impl/GetDocumentByProcessUC';
import { GetDocumentByStatusUC } from '../../src/use-case/document/impl/GetDocumentByStatusUC';
import { GetFileByIdUC } from '../../src/use-case/file/impl/GetFileByIdUC';
import { GetFileByDocumentUC } from '../../src/use-case/file/impl/GetFileByDocumentUC';
import { GetFileByStatusUC } from '../../src/use-case/file/impl/GetFileByStatusUC';
import { GetProcessByIdUC } from '../../src/use-case/process/impl/GetProcessByIdUC';
import { GetProcessByDocumentClassUC } from '../../src/use-case/process/impl/GetProcessByDocumentClassUC';
import { GetProcessByStatusUC } from '../../src/use-case/process/impl/GetProcessByStatus';
import { GetDocumentClassByDipIdUC } from '../../src/use-case/classe-documentale/impl/GetDocumentClassByDipUC';
import { GetDocumentClassByIdUC } from '../../src/use-case/classe-documentale/impl/GetDocumentClassByIdUC';
import { GetDocumentClassByStatusUC } from '../../src/use-case/classe-documentale/impl/GetDocumentClassByStatusUC';
import { GetDipByIdUC } from '../../src/use-case/dip/impl/GetDipByIdUC';
import { GetDipByStatusUC } from '../../src/use-case/dip/impl/GetDipByStatusUC';
import {
    createIntegrationContext,
    disposeIntegrationContext,
    seedBaseGraph,
    FakeIpcMain,
    type IntegrationContext,
    type SeededGraph,
} from '../helpers/integrationContext';

describe('BrowsingIpcAdapter integration', () => {
    let context: IntegrationContext;
    let seeded: SeededGraph;
    let ipcMain: FakeIpcMain;

    beforeAll(async () => {
        context = await createIntegrationContext('browse-ipc-it-');
        await fs.writeFile(path.join(context.tempDir, 'main.txt'), 'main-content', 'utf-8');
        await fs.writeFile(path.join(context.tempDir, 'attachment.txt'), 'attachment-content', 'utf-8');
        await fs.writeFile(path.join(context.tempDir, 'second.txt'), 'second-content', 'utf-8');
        seeded = seedBaseGraph(context, context.tempDir);

        context.documentRepository.updateIntegrityStatus(seeded.documentId, IntegrityStatusEnum.VALID);
        context.fileRepository.updateIntegrityStatus(seeded.mainFileId, IntegrityStatusEnum.VALID);
    });

    beforeEach(() => {
        container.reset();
        ipcMain = new FakeIpcMain();

        container.registerInstance(DocumentoUC.GET_BY_ID, new GetDocumentByIdUC(context.documentRepository));
        container.registerInstance(DocumentoUC.GET_BY_PROCESS, new GetDocumentByProcessUC(context.documentRepository));
        container.registerInstance(DocumentoUC.GET_BY_STATUS, new GetDocumentByStatusUC(context.documentRepository));

        container.registerInstance(FileUC.GET_BY_ID, new GetFileByIdUC(context.fileRepository));
        container.registerInstance(FileUC.GET_BY_DOCUMENT, new GetFileByDocumentUC(context.fileRepository));
        container.registerInstance(FileUC.GET_BY_STATUS, new GetFileByStatusUC(context.fileRepository));

        container.registerInstance(ProcessUC.GET_BY_ID, new GetProcessByIdUC(context.processRepository));
        container.registerInstance(
            ProcessUC.GET_BY_DOCUMENT_CLASS,
            new GetProcessByDocumentClassUC(context.processRepository),
        );
        container.registerInstance(ProcessUC.GET_BY_STATUS, new GetProcessByStatusUC(context.processRepository));

        container.registerInstance(
            DocumentClassUC.GET_BY_DIP_ID,
            new GetDocumentClassByDipIdUC(context.documentClassRepository),
        );
        container.registerInstance(
            DocumentClassUC.GET_BY_STATUS,
            new GetDocumentClassByStatusUC(context.documentClassRepository),
        );
        container.registerInstance(DocumentClassUC.GET_BY_ID, new GetDocumentClassByIdUC(context.documentClassRepository));

        container.registerInstance(DipUC.GET_BY_ID, new GetDipByIdUC(context.dipRepository));
        container.registerInstance(DipUC.GET_BY_STATUS, new GetDipByStatusUC(context.dipRepository));

        BrowsingIpcAdapter.register(ipcMain as never);
    });

    afterAll(async () => {
        container.reset();
        await disposeIntegrationContext(context);
    });

    it('returns document/file/process/document-class/dip DTOs by id', () => {
        const documentDto = ipcMain.invoke<{ id: number; uuid: string }>(
            IpcChannels.BROWSE_GET_DOCUMENT_BY_ID,
            seeded.documentId,
        );
        const fileDto = ipcMain.invoke<{ id: number; documentId: number }>(
            IpcChannels.BROWSE_GET_FILE_BY_ID,
            seeded.mainFileId,
        );
        const processDto = ipcMain.invoke<{ id: number; uuid: string }>(
            IpcChannels.BROWSE_GET_PROCESS_BY_ID,
            seeded.processId,
        );
        const documentClassDto = ipcMain.invoke<{ id: number; dipId: number }>(
            IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID,
            seeded.documentClassId,
        );
        const dipDto = ipcMain.invoke<{ id: number; uuid: string }>(
            IpcChannels.BROWSE_GET_DIP_BY_ID,
            seeded.dipId,
        );

        expect(documentDto.id).toBe(seeded.documentId);
        expect(fileDto.documentId).toBe(seeded.documentId);
        expect(processDto.uuid).toBe('process-1');
        expect(documentClassDto.dipId).toBe(seeded.dipId);
        expect(dipDto.uuid).toBe('dip-uuid-1');
    });

    it('returns null for missing IDs', () => {
        const documentDto = ipcMain.invoke<unknown>(IpcChannels.BROWSE_GET_DOCUMENT_BY_ID, 99999);
        const fileDto = ipcMain.invoke<unknown>(IpcChannels.BROWSE_GET_FILE_BY_ID, 99999);
        const processDto = ipcMain.invoke<unknown>(IpcChannels.BROWSE_GET_PROCESS_BY_ID, 99999);
        const documentClassDto = ipcMain.invoke<unknown>(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID, 99999);
        const dipDto = ipcMain.invoke<unknown>(IpcChannels.BROWSE_GET_DIP_BY_ID, 99999);

        expect(documentDto).toBeNull();
        expect(fileDto).toBeNull();
        expect(processDto).toBeNull();
        expect(documentClassDto).toBeNull();
        expect(dipDto).toBeNull();
    });

    it('filters by parent and integrity status channels', () => {
        const documentsByProcess = ipcMain.invoke<Array<{ processId: number }>>(
            IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
            seeded.processId,
        );
        const documentsByStatus = ipcMain.invoke<Array<{ integrityStatus: IntegrityStatusEnum }>>(
            IpcChannels.BROWSE_GET_DOCUMENTS_BY_STATUS,
            IntegrityStatusEnum.VALID,
        );

        const filesByDocument = ipcMain.invoke<Array<{ documentId: number }>>(
            IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
            seeded.documentId,
        );
        const filesByStatus = ipcMain.invoke<Array<{ integrityStatus: IntegrityStatusEnum }>>(
            IpcChannels.BROWSE_GET_FILE_BY_STATUS,
            IntegrityStatusEnum.VALID,
        );

        const processByDocumentClass = ipcMain.invoke<Array<{ documentClassId: number }>>(
            IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
            seeded.documentClassId,
        );
        const processByStatus = ipcMain.invoke<Array<{ integrityStatus: IntegrityStatusEnum }>>(
            IpcChannels.BROWSE_GET_PROCESS_BY_STATUS,
            IntegrityStatusEnum.UNKNOWN,
        );

        const documentClassByDip = ipcMain.invoke<Array<{ dipId: number }>>(
            IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID,
            seeded.dipId,
        );
        const documentClassByStatus = ipcMain.invoke<Array<{ integrityStatus: IntegrityStatusEnum }>>(
            IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_STATUS,
            IntegrityStatusEnum.UNKNOWN,
        );

        const dipByStatus = ipcMain.invoke<Array<{ integrityStatus: IntegrityStatusEnum }>>(
            IpcChannels.BROWSE_GET_DIP_BY_STATUS,
            IntegrityStatusEnum.UNKNOWN,
        );

        expect(documentsByProcess).toHaveLength(2);
        expect(documentsByStatus).toHaveLength(1);
        expect(filesByDocument).toHaveLength(2);
        expect(filesByStatus).toHaveLength(1);
        expect(processByDocumentClass).toHaveLength(1);
        expect(processByStatus).toHaveLength(1);
        expect(documentClassByDip).toHaveLength(1);
        expect(documentClassByStatus).toHaveLength(1);
        expect(dipByStatus).toHaveLength(1);
    });
});
