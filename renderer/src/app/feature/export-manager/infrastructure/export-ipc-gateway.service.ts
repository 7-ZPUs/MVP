import { Injectable }          from '@angular/core';
import { IExportChannel }      from '../contracts/i-export-channel';
import { ExportResult }        from '../../../../../../shared/domain/ExportResult';
import { SaveDialogResponseDto , FileDTO} from '../domain/dtos';

@Injectable({ providedIn: 'root' })
export class ExportIpcGateway implements IExportChannel {

    private get ipc() {
        return (globalThis as any).electron;
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
        return await this.ipc.invoke('file:download', fileId, destPath);
    }

    async openSaveDialog(defaultName?: string): Promise<SaveDialogResponseDto> {
        if (!this.ipc) return { canceled: true };
        return await this.ipc.invoke('file:save-dialog', defaultName);
    }

    // export-ipc-gateway.service.ts
    async getFileDto(fileId: number): Promise<FileDTO | null> {
        if (!this.ipc) return null;
        return await this.ipc.invoke('browse:get-file-by-id', fileId);
    }

    // export-ipc-gateway.service.ts
    async openExternal(filePath: string): Promise<void> {
        if (!this.ipc) return;
        await this.ipc.invoke('file:open-external', filePath);
    }
}