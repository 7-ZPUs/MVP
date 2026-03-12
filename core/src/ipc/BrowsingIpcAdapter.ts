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
    }
}
