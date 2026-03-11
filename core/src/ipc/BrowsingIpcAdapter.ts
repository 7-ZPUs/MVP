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

import type { IGetDocumentoByIdUC } from '../use-case/document/IGetDocumentoByIdUC';
import type { IGetDocumentiByProcessUC } from '../use-case/document/IGetDocumentiByProcessUC';
import type { IGetDocumentiByStatusUC } from '../use-case/document/IGetDocumentiByStatusUC';
import { DocumentoUC } from '../use-case/document/tokens';

import type { IGetFileByIdUC } from '../use-case/file/IGetFileByIdUC';
import type { IGetFilesByDocumentUC } from '../use-case/file/IGetFilesByDocumentUC';
import type { IGetFilesByStatusUC } from '../use-case/file/IGetFilesByStatusUC';
import { FileUC } from '../use-case/file/tokens';

export class BrowsingIpcAdapter {
    static register(ipcMain: IpcMain): void {
        // ---- Documento use cases ----
        const getDocByIdUC = container.resolve<IGetDocumentoByIdUC>(DocumentoUC.GET_BY_ID);
        const getDocByProcessUC = container.resolve<IGetDocumentiByProcessUC>(DocumentoUC.GET_BY_PROCESS);
        const getDocByStatusUC = container.resolve<IGetDocumentiByStatusUC>(DocumentoUC.GET_BY_STATUS);

        // ---- File use cases ----
        const getFileByIdUC = container.resolve<IGetFileByIdUC>(FileUC.GET_BY_ID);
        const getFilesByDocUC = container.resolve<IGetFilesByDocumentUC>(FileUC.GET_BY_DOCUMENT);
        const getFilesByStatusUC = container.resolve<IGetFilesByStatusUC>(FileUC.GET_BY_STATUS);

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

        ipcMain.handle(IpcChannels.BROWSE_GET_FILES_BY_DOCUMENT, (_event, documentId: number) => {
            return getFilesByDocUC.execute(documentId).map((f) => f.toDTO());
        });

        ipcMain.handle(IpcChannels.BROWSE_GET_FILES_BY_STATUS, (_event, status: IntegrityStatusEnum) => {
            return getFilesByStatusUC.execute(status).map((f) => f.toDTO());
        });
    }
}
