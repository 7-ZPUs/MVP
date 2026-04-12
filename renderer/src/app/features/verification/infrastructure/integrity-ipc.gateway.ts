import { Injectable } from '@angular/core';
import { IIntegrityIpcGateway } from '../contracts/IIntegrityIpcGateway';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import {
  DocumentClassDTO,
  ProcessDTO,
  DocumentDTO,
  FileDTO,
} from '../../../shared/domain/dto/indexDTO';

@Injectable({ providedIn: 'root' })
export class IntegrityIpcGateway implements IIntegrityIpcGateway {
  private async invoke<T>(channel: string, ...args: any[]): Promise<T> {
    const electronApi = (window as any).electronAPI || (window as any).api;
    if (electronApi && typeof electronApi.invoke === 'function') {
      return electronApi.invoke(channel, ...args);
    }
    throw new Error(`Electron API not available for channel ${channel}`);
  }

  // --- COMMANDS ---
  async checkDipIntegrity(dipId: number): Promise<IntegrityStatusEnum> {
    return this.invoke(IpcChannels.CHECK_DIP_INTEGRITY_STATUS, dipId);
  }
  async checkDocumentClassIntegrity(classId: number): Promise<IntegrityStatusEnum> {
    return this.invoke(IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS, classId);
  }
  async checkProcessIntegrity(processId: number): Promise<IntegrityStatusEnum> {
    return this.invoke(IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS, processId);
  }
  async checkDocumentIntegrity(documentId: number): Promise<IntegrityStatusEnum> {
    return this.invoke(IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS, documentId);
  }
  async checkFileIntegrity(fileId: number): Promise<IntegrityStatusEnum> {
    return this.invoke(IpcChannels.CHECK_FILE_INTEGRITY_STATUS, fileId);
  }

  // --- QUERIES ---

  async getClassesByDipId(dipId: number): Promise<DocumentClassDTO[]> {
    return this.invoke(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID, dipId);
  }

  async getProcessesByClassId(classId: number): Promise<ProcessDTO[]> {
    return this.invoke(IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS, classId);
  }

  async getDocumentsByProcessId(processId: number): Promise<DocumentDTO[]> {
    return this.invoke(IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS, processId);
  }

  async getFilesByDocumentId(documentId: number): Promise<FileDTO[]> {
    return this.invoke(IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT, documentId);
  }
}
