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
import type { ICreateDocumentUC } from '../use-case/document/ICreateDocumentUC';
import { DocumentoUC } from '../use-case/document/tokens';
import type { ICreateFileUC } from '../use-case/file/ICreateFileUC';
import { FileUC } from '../use-case/file/tokens';
import type { ICreateProcessUC } from '../use-case/process/ICreateProcessUC';
import { ProcessUC } from '../use-case/process/token';
import { ICreateDocumentClassUC } from '../use-case/classe-documentale/ICreateDocumentClassUC';
import { DocumentClassUC } from '../use-case/classe-documentale/tokens';
import { CreateDocumentClassDTO } from '../dto/DocumentClassDTO';
import { ICreateDipUC } from '../use-case/dip/ICreateDipUC';
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
            return createDocumentUC.execute(dto).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_FILE, (_event, dto: CreateFileDTO) => {
            return createFileUC.execute(dto).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_PROCESS, (_event, dto: CreateProcessDTO) => {
            return createProcessUC.execute(dto).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_DOCUMENT_CLASS, (_event, dto: CreateDocumentClassDTO) => {
            return createDocumentClassUC.execute(dto).toDTO();
        });

        ipcMain.handle(IpcChannels.CREATE_DIP, (_event, dto: CreateDipDTO) => {
            return createDipUC.execute(dto).toDTO();
        });
    }
}
