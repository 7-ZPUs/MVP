/**
 * CreateIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel di creazione per Documento, File e Process.
 * Non contiene business logic: delega tutto agli use case.
 */
import { IpcMain } from 'electron';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';

import { CreateDocumentDTO } from '../dto/DocumentDTO';
import { CreateFileDTO } from '../dto/FileDTO';
import { CreateProcessDTO } from '../dto/ProcessDTO';
import type { CreateDocumentInput, ICreateDocumentUC } from '../use-case/document/ICreateDocumentUC';
import { DocumentoUC } from '../use-case/document/tokens';
import type { CreateFileInput, ICreateFileUC } from '../use-case/file/ICreateFileUC';
import { FileUC } from '../use-case/file/tokens';
import type { CreateProcessInput, ICreateProcessUC } from '../use-case/process/ICreateProcessUC';
import { ProcessUC } from '../use-case/process/token';
import type { CreateDocumentClassInput, ICreateDocumentClassUC } from '../use-case/classe-documentale/ICreateDocumentClassUC';
import { DocumentClassUC } from '../use-case/classe-documentale/tokens';
import { CreateDocumentClassDTO } from '../dto/DocumentClassDTO';
import type { CreateDipInput, ICreateDipUC } from '../use-case/dip/ICreateDipUC';
import { DipUC } from '../use-case/dip/token';
import { CreateDipDTO } from '../dto/DipDTO';

export class CreateIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const createDocumentUC = container.resolve<ICreateDocumentUC>(DocumentoUC.CREATE);
        const createFileUC = container.resolve<ICreateFileUC>(FileUC.CREATE);
        const createProcessUC = container.resolve<ICreateProcessUC>(ProcessUC.CREATE);
        const createDocumentClassUC = container.resolve<ICreateDocumentClassUC>(DocumentClassUC.CREATE);
        const createDipUC = container.resolve<ICreateDipUC>(DipUC.CREATE);

        ipcMain.handle(IpcChannels.CREATE_DOCUMENT, (_event, dto: CreateDocumentDTO) => {
            const input: CreateDocumentInput = {
                processId: dto.processId,
                uuid: dto.uuid,
                metadata: dto.metadata,
            };

            return createDocumentUC.execute(input).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_FILE, (_event, dto: CreateFileDTO) => {
            const input: CreateFileInput = {
                documentId: dto.documentId,
                filename: dto.filename,
                path: dto.path,
                isMain: dto.isMain,
                hash: dto.hash,
            };

            return createFileUC.execute(input).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_PROCESS, (_event, dto: CreateProcessDTO) => {
            const input: CreateProcessInput = {
                documentClassId: dto.documentClassId,
                uuid: dto.uuid,
                metadata: dto.metadata,
            };

            return createProcessUC.execute(input).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_DOCUMENT_CLASS, (_event, dto: CreateDocumentClassDTO) => {
            const input: CreateDocumentClassInput = {
                dipId: dto.dipId,
                uuid: dto.uuid,
                name: dto.name,
                timestamp: dto.timestamp,
            };

            return createDocumentClassUC.execute(input).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_DIP, (_event, dto: CreateDipDTO) => {
            const input: CreateDipInput = {
                uuid: dto.uuid,
            };

            return createDipUC.execute(input).toDTO();
        });
    }
}
