/**
 * CreateIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel di creazione per Documento, File e Process.
 * Non contiene business logic: delega tutto agli use case.
 */
import { IpcMain } from "electron";
import { container } from "tsyringe";

import { IpcChannels } from "../../../shared/ipc-channels";

import { CreateDocumentDTO } from "../dto/DocumentDTO";
import { CreateFileDTO } from "../dto/FileDTO";
import { CreateProcessDTO } from "../dto/ProcessDTO";
import { CreateDocumentClassDTO } from "../dto/DocumentClassDTO";
import { CreateDipDTO } from "../dto/DipDTO";
import type { MetadataDTO } from "../dto/MetadataDTO";
import { Document } from "../entity/Document";
import { File } from "../entity/File";
import { Process } from "../entity/Process";
import { DocumentClass } from "../entity/DocumentClass";
import { Dip } from "../entity/Dip";
import { Metadata } from "../value-objects/Metadata";
import type { ICreateDocumentUC } from "../use-case/document/ICreateDocumentUC";
import { DocumentoUC } from "../use-case/document/tokens";
import type { ICreateFileUC } from "../use-case/file/ICreateFileUC";
import { FileUC } from "../use-case/file/tokens";
import type { ICreateProcessUC } from "../use-case/process/ICreateProcessUC";
import { ProcessUC } from "../use-case/process/token";
import { ICreateDocumentClassUC } from "../use-case/classe-documentale/ICreateDocumentClassUC";
import { DocumentClassUC } from "../use-case/classe-documentale/tokens";
import { ICreateDipUC } from "../use-case/dip/ICreateDipUC";
import { DipUC } from "../use-case/dip/token";

export class CreateIpcAdapter {
  static register(ipcMain: IpcMain): void {
    const createDocumentUC = container.resolve<ICreateDocumentUC>(
      DocumentoUC.CREATE,
    );
    const createFileUC = container.resolve<ICreateFileUC>(FileUC.CREATE);
    const createProcessUC = container.resolve<ICreateProcessUC>(
      ProcessUC.CREATE,
    );
    const createDocumentClassUC = container.resolve<ICreateDocumentClassUC>(
      DocumentClassUC.CREATE,
    );
    const createDipUC = container.resolve<ICreateDipUC>(DipUC.CREATE);

    const toMetadata = (dto: MetadataDTO) =>
      new Metadata(dto.name, dto.value, dto.type);

    ipcMain.handle(
      IpcChannels.CREATE_DOCUMENT,
      (_event, dto: CreateDocumentDTO) => {
        const document = new Document(
          dto.uuid,
          dto.metadata.map(toMetadata),
          dto.processId,
        );
        return createDocumentUC.execute(document).toDTO();
      },
    );

    ipcMain.handle(IpcChannels.CREATE_FILE, (_event, dto: CreateFileDTO) => {
      const file = new File(dto.filename, dto.path, dto.isMain, dto.documentId);
      return createFileUC.execute(file).toDTO();
    });

    ipcMain.handle(
      IpcChannels.CREATE_PROCESS,
      (_event, dto: CreateProcessDTO) => {
        const process = new Process(
          dto.documentClassId,
          dto.uuid,
          dto.metadata.map(toMetadata),
        );
        return createProcessUC.execute(process).toDTO();
      },
    );

    ipcMain.handle(
      IpcChannels.CREATE_DOCUMENT_CLASS,
      (_event, dto: CreateDocumentClassDTO) => {
        const documentClass = new DocumentClass(
          dto.dipId,
          dto.uuid,
          dto.name,
          dto.timestamp,
        );
        return createDocumentClassUC.execute(documentClass).toDTO();
      },
    );

    ipcMain.handle(IpcChannels.CREATE_DIP, (_event, dto: CreateDipDTO) => {
      const dip = new Dip(dto.uuid);
      return createDipUC.execute(dip).toDTO();
    });
  }
}
