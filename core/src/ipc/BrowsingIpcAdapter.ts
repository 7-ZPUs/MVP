/**
 * BrowsingIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel per la navigazione di Documento e File.
 * Non contiene business logic: delega tutto agli use case.
 *
 * Flusso:
 *   Renderer  →  ipcMain.handle  →  BrowsingIpcAdapter  →  Use Case  →  Repository
 */
import { IpcMain } from 'electron';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';
import { IntegrityStatusEnum } from '../value-objects/IntegrityStatusEnum';

import type { IGetDocumentByIdUC } from '../use-case/document/IGetDocumentByIdUC';
import type { IGetDocumentByProcessUC } from '../use-case/document/IGetDocumentByProcessUC';
import type { IGetDocumentByStatusUC } from '../use-case/document/IGetDocumentByStatusUC';
import { DocumentoUC } from '../use-case/document/tokens';

import type { IGetFileByIdUC } from '../use-case/file/IGetFileByIdUC';
import type { IGetFileByDocumentUC } from '../use-case/file/IGetFileByDocumentUC';
import type { IGetFileByStatusUC } from '../use-case/file/IGetFileByStatusUC';
import { FileUC } from '../use-case/file/tokens';
import { IGetProcessByDocumentClassUC } from '../use-case/process/IGetProcessByDocumentClassUC';
import { IGetProcessByIdUC } from '../use-case/process/IGetProcessByIdUC';
import { IGetProcessByStatusUC } from '../use-case/process/IGetProcessByStatusUC';
import { ProcessUC } from '../use-case/process/token';
import { IGetDocumentClassByDipIdUC } from '../use-case/classe-documentale/IGetDocumentClassByDipUC';
import { IGetDocumentClassByIdUC } from '../use-case/classe-documentale/IGetDocumentClassByIdUC';
import { IGetDocumentClassByStatusUC } from '../use-case/classe-documentale/IGetDocumentClassByStatusUC';
import { DocumentClassUC } from '../use-case/classe-documentale/tokens';

export class BrowsingIpcAdapter {
    static register(ipcMain: IpcMain): void {
        // ---- Documento use cases ----
        const getDocByIdUC = container.resolve<IGetDocumentByIdUC>(DocumentoUC.GET_BY_ID);
        const getDocByProcessUC = container.resolve<IGetDocumentByProcessUC>(DocumentoUC.GET_BY_PROCESS);
        const getDocByStatusUC = container.resolve<IGetDocumentByStatusUC>(DocumentoUC.GET_BY_STATUS);

        // ---- File use cases ----
        const getFileByIdUC = container.resolve<IGetFileByIdUC>(FileUC.GET_BY_ID);
        const getFileByDocUC = container.resolve<IGetFileByDocumentUC>(FileUC.GET_BY_DOCUMENT);
        const getFileByStatusUC = container.resolve<IGetFileByStatusUC>(FileUC.GET_BY_STATUS);

        // ---- Process use cases ----
        const getProcessByIdUC = container.resolve<IGetProcessByIdUC>(ProcessUC.GET_BY_ID);
        const getProcessByStatusUC = container.resolve<IGetProcessByStatusUC>(ProcessUC.GET_BY_STATUS);
        const getProcessByDocumentClassUC = container.resolve<IGetProcessByDocumentClassUC>(ProcessUC.GET_BY_DOCUMENT_CLASS);

        // ---- DocumentClass use cases ----
        const getDocClassByDipIdUC = container.resolve<IGetDocumentClassByDipIdUC>(DocumentClassUC.GET_BY_DIP_ID);
        const getDocClassByStatusUC = container.resolve<IGetDocumentClassByStatusUC>(DocumentClassUC.GET_BY_STATUS);
        const getDocClassByIdUC = container.resolve<IGetDocumentClassByIdUC>(DocumentClassUC.GET_BY_ID);

        // ------------------------------------------------------------------ //
        // Documento channels
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.BROWSE_GET_DOCUMENT_BY_ID, (_event, id: number) => {
            return getDocByIdUC.execute(id)?.toDTO() ?? null;
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS, (_event, processId: number) => {
            return getDocByProcessUC.execute(processId).map((d) => d.toDTO());
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_DOCUMENTS_BY_STATUS, (_event, status: IntegrityStatusEnum) => {
            return getDocByStatusUC.execute(status).map((d) => d.toDTO());
        });

        // ------------------------------------------------------------------ //
        // File channels
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.BROWSE_GET_FILE_BY_ID, (_event, id: number) => {
            return getFileByIdUC.execute(id)?.toDTO() ?? null;
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT, (_event, documentId: number) => {
            return getFileByDocUC.execute(documentId).map((f) => f.toDTO());
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_FILE_BY_STATUS, (_event, status: IntegrityStatusEnum) => {
            return getFileByStatusUC.execute(status).map((f) => f.toDTO());
        });

        // ------------------------------------------------------------------ //
        // Process channels
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.BROWSE_GET_PROCESS_BY_ID, (_event, id: number) => {
            return getProcessByIdUC.execute(id)?.toDTO() ?? null;
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_PROCESS_BY_STATUS, (_event, status: IntegrityStatusEnum) => {
            return getProcessByStatusUC.execute(status).map((p) => p.toDTO());
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS, (_event, documentClassId: number) => {
            return getProcessByDocumentClassUC.execute(documentClassId).map((p) => p.toDTO());
        });

        // ------------------------------------------------------------------ //
        // DocumentClass channels
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID, (_event, dipId: number) => {
            return getDocClassByDipIdUC.execute(dipId).map((dc) => dc.toDTO());
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_STATUS, (_event, status: IntegrityStatusEnum) => {
            return getDocClassByStatusUC.execute(status).map((dc) => dc.toDTO());
        });     
        
        ipcMain.handle(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID, (_event, id: number) => {
            return getDocClassByIdUC.execute(id)?.toDTO() ?? null;
        });

    }
}
