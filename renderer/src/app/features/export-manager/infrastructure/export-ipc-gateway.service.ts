import { Injectable } from '@angular/core';
import { IExportChannel } from '../contracts/i-export-channel';
import { ExportResult } from '../../../../../../shared/domain/ExportResult';
import { FileDTO } from '../domain/dtos';
import { IpcChannels } from '@shared/ipc-channels';
import { ExportFileResults } from '@shared/domain/ExportFileResults';

@Injectable({ providedIn: 'root' })
export class ExportIpcGateway implements IExportChannel {
  private get ipc() {
    return (globalThis as any).electronAPI;
  }

  // --- Export singolo: non passa più destPath, il dialog è nel UC ---
  async exportFile(fileId: number): Promise<ExportResult> {
    if (!this.ipc) return ExportResult.fail('BRIDGE_UNAVAILABLE', 'Bridge non disponibile');
    return this.ipc.invoke(IpcChannels.FILE_DOWNLOAD, fileId);
  }

  // --- Export multiplo: niente dialog qui, solo i fileIds ---
  async exportFiles( fileIds: number[], ): Promise<ExportFileResults> {
    if (!this.ipc) return { canceled: false, results: [] };
    return this.ipc.invoke(IpcChannels.FILE_DOWNLOAD_MANY, fileIds);
  }

  async getFileDto(fileId: number): Promise<FileDTO | null> {
    if (!this.ipc) return null;
    return this.ipc.invoke('browse:get-file-by-id', fileId);
  }

  async getFilesByDocumentId(documentId: number): Promise<FileDTO[]> {
    if (!this.ipc) return [];
    return this.ipc.invoke('browse:get-file-by-document', documentId);
  }

  async printFile(fileId: number): Promise<ExportResult> {
    if (!this.ipc) return ExportResult.fail('BRIDGE_UNAVAILABLE', 'Bridge non disponibile');
    return this.ipc.invoke(IpcChannels.FILE_PRINT, fileId);
  }

  async printFiles( fileIds: number[] ): Promise<ExportFileResults> {
    if (!this.ipc) return { canceled: false, results: [] };
    return this.ipc.invoke(IpcChannels.FILE_PRINT_MANY, fileIds);
  }

  onExportProgress(callback: (data: { current: number; total: number }) => void): () => void {
    const unsub = this.ipc?.on(IpcChannels.FILE_DOWNLOAD_PROGRESS, (data: any) => callback(data));
    return unsub ?? (() => {});
  }

  onPrintProgress(callback: (data: { current: number; total: number }) => void): () => void {
    const unsub = this.ipc?.on(IpcChannels.FILE_PRINT_PROGRESS, (data: any) => callback(data));
    return unsub ?? (() => {});
  }
}