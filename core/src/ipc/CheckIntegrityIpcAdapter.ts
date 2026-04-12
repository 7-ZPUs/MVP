/**
 * CheckIntegrityIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel per il controllo dell'integrità di Documento, File, Process, DocumentClass e Dip.
 * Non contiene business logic: delega tutto agli use case.
 *
 * Flusso:
 *   Renderer  →  ipcMain.handle  →  CheckIntegrityIpcAdapter  →  Use Case  →  Repository
 */
import { IpcMain } from 'electron';
import { container } from 'tsyringe';

import type { ICheckDocumentIntegrityStatusUC } from '../use-case/document/ICheckDocumentIntegrityStatusUC';
import { DocumentoUC } from '../use-case/document/tokens';

import type { ICheckFileIntegrityStatusUC } from '../use-case/file/ICheckFileIntegrityStatusUC';
import { FileUC } from '../use-case/file/tokens';

import type { ICheckProcessIntegrityStatusUC } from '../use-case/process/ICheckProcessIntegrityStatusUC';
import { ProcessUC } from '../use-case/process/token';

import type { ICheckDocumentClassIntegrityStatusUC } from '../use-case/classe-documentale/ICheckDocumentClassIntegrityStatusUC';
import { DocumentClassUC } from '../use-case/classe-documentale/tokens';

import type { ICheckDipIntegrityStatusUC } from '../use-case/dip/ICheckDipIntegrityStatusUC';
import { DipUC } from '../use-case/dip/token';

import { IpcChannels } from '../../../shared/ipc-channels';

export class CheckIntegrityIpcAdapter {
    static register(ipcMain: IpcMain): void {
        // ---- Documento use case ----
        const checkDocumentIntegrityUC: ICheckDocumentIntegrityStatusUC = container.resolve<ICheckDocumentIntegrityStatusUC>(
            DocumentoUC.CHECK_INTEGRITY_STATUS
        );

        // ---- File use case ----
        const checkFileIntegrityUC: ICheckFileIntegrityStatusUC = container.resolve<ICheckFileIntegrityStatusUC>(
            FileUC.CHECK_INTEGRITY_STATUS
        );

        // ---- Process use case ----
        const checkProcessIntegrityUC: ICheckProcessIntegrityStatusUC = container.resolve<ICheckProcessIntegrityStatusUC>(
            ProcessUC.CHECK_INTEGRITY_STATUS
        );

        // ---- DocumentClass use case ----
        const checkDocumentClassIntegrityUC: ICheckDocumentClassIntegrityStatusUC = container.resolve<ICheckDocumentClassIntegrityStatusUC>(
            DocumentClassUC.CHECK_INTEGRITY_STATUS
        );

        // ---- Dip use case ----
        const checkDipIntegrityUC: ICheckDipIntegrityStatusUC = container.resolve<ICheckDipIntegrityStatusUC>(
            DipUC.CHECK_INTEGRITY_STATUS
        );

        // ------------------------------------------------------------------ //
        // Documento integrity check
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS, (_event, id: number) => {
            return checkDocumentIntegrityUC.execute(id);
        });

        // ------------------------------------------------------------------ //
        // File integrity check
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.CHECK_FILE_INTEGRITY_STATUS, async (_event, id: number) => {
            return await checkFileIntegrityUC.execute(id);
        });

        // ------------------------------------------------------------------ //
        // Process integrity check
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS, (_event, id: number) => {
            return checkProcessIntegrityUC.execute(id);
        });

        // ------------------------------------------------------------------ //
        // DocumentClass integrity check
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS, (_event, id: number) => {
            return checkDocumentClassIntegrityUC.execute(id);
        });

        // ------------------------------------------------------------------ //
        // Dip integrity check
        // ------------------------------------------------------------------ //

        ipcMain.handle(IpcChannels.CHECK_DIP_INTEGRITY_STATUS, (_event, id: number) => {
            return checkDipIntegrityUC.execute(id);
        });
    }
}
