import { Injectable } from '@angular/core';
import { IExportChannel } from '../contracts/i-export-channel';
import { ExportResult } from '../../../../../../shared/domain/ExportResult';
import { SaveDialogResponseDto, FileDTO } from '../domain/dtos';

@Injectable({ providedIn: 'root' })
export class ExportIpcGateway implements IExportChannel {

    private get ipc() {
        return (globalThis as any).electronAPI;
    }

    constructor() {
        if (!this.ipc) {
            console.warn('Electron Bridge non trovato in ExportIpcGateway.');
        }
    }

    async exportFile(fileId: number, destPath: string): Promise<ExportResult> {
        if (!this.ipc) {
            return ExportResult.fail('BRIDGE_UNAVAILABLE', 'Electron bridge non disponibile');
        }
        return await this.ipc.invoke('file:download', { fileId, destPath });
    }

    async openSaveDialog(defaultName?: string): Promise<SaveDialogResponseDto> {
        if (!this.ipc) return { canceled: true };
        return await this.ipc.invoke('file:save-dialog', defaultName);
    }

    async openFolderDialog(): Promise<{ canceled: boolean; folderPath?: string }> {
        if (!this.ipc) return { canceled: true };
        return await this.ipc.invoke('file:folder-dialog');
    }

    async getFileDto(fileId: number): Promise<FileDTO | null> {
        if (!this.ipc) return null;
        return await this.ipc.invoke('browse:get-file-by-id', fileId);
    }

    async openExternal(filePath: string): Promise<void> {
        if (!this.ipc) return;
        await this.ipc.invoke('file:open-external', filePath);
    }

    async getFilesByDocumentId(documentId: number): Promise<FileDTO[]> {
        if (!this.ipc) return [];
        return await this.ipc.invoke('browse:get-file-by-document', documentId);
    }

    async printFile(fileId: number): Promise<{ success: boolean; error?: string }> {
        if (!this.ipc) return { success: false, error: 'Bridge non disponibile' };
        return await this.ipc.invoke('file:print', fileId);
    }

    async printFiles(fileIds: number[]): Promise<{ canceled: boolean; results: { fileId: number; success: boolean; error?: string }[]; }> {
        if (!this.ipc) return { canceled: false, results: [] };
        return await this.ipc.invoke('file:print-many', fileIds);
    }

    onPrintProgress(callback: (data: { current: number; total: number }) => void): () => void {
        const unsubscribe = this.ipc?.on('file:print-progress', (data: any) => callback(data));
        return unsubscribe ?? (() => { });
    }
}