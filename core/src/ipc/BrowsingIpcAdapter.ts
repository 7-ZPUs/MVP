/**
 * BrowsingIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel per la navigazione di Documento e File.
 * Non contiene business logic: delega tutto agli use case.
 *
 * Flusso:
 *   Renderer  →  ipcMain.handle  →  BrowsingIpcAdapter  →  Use Case  →  Repository
 */
import { IpcMain } from "electron";
import { container } from "tsyringe";

import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { EntityToDtoConverter } from "../repo/impl/EntityToDtoConverter";

import type { IGetDocumentByIdUC } from "../use-case/document/IGetDocumentByIdUC";
import type { IGetDocumentByProcessUC } from "../use-case/document/IGetDocumentByProcessUC";
import type { IGetDocumentByStatusUC } from "../use-case/document/IGetDocumentByStatusUC";
import { DocumentoUC } from "../use-case/document/tokens";

import type { IGetFileByIdUC } from "../use-case/file/IGetFileByIdUC";
import type { IGetFileByDocumentUC } from "../use-case/file/IGetFileByDocumentUC";
import type { IGetFileByStatusUC } from "../use-case/file/IGetFileByStatusUC";
import { FileUC } from "../use-case/file/tokens";
import { IGetProcessByDocumentClassUC } from "../use-case/process/IGetProcessByDocumentClassUC";
import { IGetProcessByIdUC } from "../use-case/process/IGetProcessByIdUC";
import { IGetProcessByStatusUC } from "../use-case/process/IGetProcessByStatusUC";
import { ProcessUC } from "../use-case/process/token";
import { IGetDocumentClassByDipIdUC } from "../use-case/classe-documentale/IGetDocumentClassByDipUC";
import { IGetDocumentClassByIdUC } from "../use-case/classe-documentale/IGetDocumentClassByIdUC";
import { IGetDocumentClassByStatusUC } from "../use-case/classe-documentale/IGetDocumentClassByStatusUC";
import { DocumentClassUC } from "../use-case/classe-documentale/tokens";
import { IGetDipByIdUC } from "../use-case/dip/IGetDipByIdUC";
import { IGetDipByStatusUC } from "../use-case/dip/IGetDipByStatusUC";
import { DipUC } from "../use-case/dip/token";
import { IpcChannels } from "../../../shared/ipc-channels";

export class BrowsingIpcAdapter {
  static register(ipcMain: IpcMain): void {
    // ---- Documento use cases ----
    const getDocByIdUC: IGetDocumentByIdUC = container.resolve<IGetDocumentByIdUC>(
      DocumentoUC.GET_BY_ID,
    );
    const getDocByProcessUC: IGetDocumentByProcessUC = container.resolve<IGetDocumentByProcessUC>(
      DocumentoUC.GET_BY_PROCESS,
    );
    const getDocByStatusUC: IGetDocumentByStatusUC = container.resolve<IGetDocumentByStatusUC>(
      DocumentoUC.GET_BY_STATUS,
    );

    // ---- File use cases ----
    const getFileByIdUC: IGetFileByIdUC = container.resolve<IGetFileByIdUC>(FileUC.GET_BY_ID);
    const getFileByDocUC: IGetFileByDocumentUC = container.resolve<IGetFileByDocumentUC>(
      FileUC.GET_BY_DOCUMENT,
    );
    const getFileByStatusUC: IGetFileByStatusUC = container.resolve<IGetFileByStatusUC>(
      FileUC.GET_BY_STATUS,
    );

    // ---- Process use cases ----
    const getProcessByIdUC: IGetProcessByIdUC = container.resolve<IGetProcessByIdUC>(
      ProcessUC.GET_BY_ID,
    );
    const getProcessByStatusUC: IGetProcessByStatusUC = container.resolve<IGetProcessByStatusUC>(
      ProcessUC.GET_BY_STATUS,
    );
    const getProcessByDocumentClassUC: IGetProcessByDocumentClassUC = container.resolve<IGetProcessByDocumentClassUC>(
      ProcessUC.GET_BY_DOCUMENT_CLASS,
    );

    // ---- DocumentClass use cases ----
    const getDocClassByDipIdUC: IGetDocumentClassByDipIdUC = container.resolve<IGetDocumentClassByDipIdUC>(
      DocumentClassUC.GET_BY_DIP_ID,
    );
    const getDocClassByStatusUC: IGetDocumentClassByStatusUC = container.resolve<IGetDocumentClassByStatusUC>(
      DocumentClassUC.GET_BY_STATUS,
    );
    const getDocClassByIdUC: IGetDocumentClassByIdUC = container.resolve<IGetDocumentClassByIdUC>(
      DocumentClassUC.GET_BY_ID,
    );

    const getDipByIdUC: IGetDipByIdUC = container.resolve<IGetDipByIdUC>(DipUC.GET_BY_ID);
    const getDipByStatusUC: IGetDipByStatusUC = container.resolve<IGetDipByStatusUC>(
      DipUC.GET_BY_STATUS,
    );

    // ------------------------------------------------------------------ //
    // Documento channels
    // ------------------------------------------------------------------ //

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DOCUMENT_BY_ID,
      (_event, id: number) => {
        const doc = getDocByIdUC.execute(id);
        return doc ? EntityToDtoConverter.documentToDto(doc) : null;
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
      (_event, processId: number) => {
        return getDocByProcessUC
          .execute(processId)
          .map((d) => EntityToDtoConverter.documentToDto(d));
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_STATUS,
      (_event, status: IntegrityStatusEnum) => {
        return getDocByStatusUC
          .execute(status)
          .map((d) => EntityToDtoConverter.documentToDto(d));
      },
    );

    // ------------------------------------------------------------------ //
    // File channels
    // ------------------------------------------------------------------ //

    ipcMain.handle(IpcChannels.BROWSE_GET_FILE_BY_ID, (_event, id: number) => {
      const file = getFileByIdUC.execute(id);
      return file ? EntityToDtoConverter.fileToDto(file) : null;
    });

    ipcMain.handle(
      IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
      (_event, documentId: number) => {
        return getFileByDocUC
          .execute(documentId)
          .map((f) => EntityToDtoConverter.fileToDto(f));
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_FILE_BY_STATUS,
      (_event, status: IntegrityStatusEnum) => {
        return getFileByStatusUC
          .execute(status)
          .map((f) => EntityToDtoConverter.fileToDto(f));
      },
    );

    // ------------------------------------------------------------------ //
    // Process channels
    // ------------------------------------------------------------------ //

    ipcMain.handle(
      IpcChannels.BROWSE_GET_PROCESS_BY_ID,
      (_event, id: number) => {
        const process = getProcessByIdUC.execute(id);
        return process ? EntityToDtoConverter.processToDto(process) : null;
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_PROCESS_BY_STATUS,
      (_event, status: IntegrityStatusEnum) => {
        return getProcessByStatusUC
          .execute(status)
          .map((p) => EntityToDtoConverter.processToDto(p));
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
      (_event, documentClassId: number) => {
        return getProcessByDocumentClassUC
          .execute(documentClassId)
          .map((p) => EntityToDtoConverter.processToDto(p));
      },
    );

    // ------------------------------------------------------------------ //
    // DocumentClass channels
    // ------------------------------------------------------------------ //

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID,
      (_event, dipId: number) => {
        return getDocClassByDipIdUC
          .execute(dipId)
          .map((dc) => EntityToDtoConverter.documentClassToDto(dc));
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_STATUS,
      (_event, status: IntegrityStatusEnum) => {
        return getDocClassByStatusUC
          .execute(status)
          .map((dc) => EntityToDtoConverter.documentClassToDto(dc));
      },
    );

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID,
      (_event, id: number) => {
        const docClass = getDocClassByIdUC.execute(id);
        return docClass
          ? EntityToDtoConverter.documentClassToDto(docClass)
          : null;
      },
    );

    // ------------------------------------------------------------------ //
    // Dip channels
    // ------------------------------------------------------------------ //

    ipcMain.handle(IpcChannels.BROWSE_GET_DIP_BY_ID, (_event, id: number) => {
      const dip = getDipByIdUC.execute(id);
      return dip ? EntityToDtoConverter.dipToDto(dip) : null;
    });

    ipcMain.handle(
      IpcChannels.BROWSE_GET_DIP_BY_STATUS,
      (_event, status: IntegrityStatusEnum) => {
        return getDipByStatusUC
          .execute(status)
          .map((d) => EntityToDtoConverter.dipToDto(d));
      },
    );
  }
}
