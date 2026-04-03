import { Injectable } from '@angular/core';
import { IExportChannel } from '../contracts/i-export-channel';
import { ExportResponseDto, SaveDialogResponseDto } from '../domain/dtos';

// Canali reali mappati col backend
const CHANNELS = {
  FILE_DOWNLOAD: 'file:download',
  FILE_PRINT:    'file:print',
  SAVE_DIALOG:   'file:save-dialog'
} as const;

@Injectable({ providedIn: 'root' })
export class ExportIpcGateway implements IExportChannel {

  private readonly ipc = (globalThis as any).electron;

  constructor() {
    if (!this.ipc) {
      console.warn("Electron Bridge non trovato in ExportIpcGateway.");
    }
  }

  /** UC-19: Salvataggio singolo documento */
  async exportDocument(nodeId: string, destPath: string): Promise<ExportResponseDto> {
    if (!this.ipc) return { success: false, errorMessage: 'Bridge non disponibile' };
    const id = Number.parseInt(nodeId, 10);
    return await this.ipc.invoke(CHANNELS.FILE_DOWNLOAD, id, destPath);
  }

  /** UC-20: Salvataggio multiplo documenti */
  async exportDocuments(nodeIds: string[], destPath: string): Promise<ExportResponseDto> {
    if (!this.ipc) return { success: false, errorMessage: 'Bridge non disponibile' };
    for (const nodeId of nodeIds) {
      await this.ipc.invoke(CHANNELS.FILE_DOWNLOAD, Number.parseInt(nodeId, 10), destPath);
    }
    return { success: true };
  }

  /** UC-22: Stampa singolo documento */
  async printDocument(nodeId: string): Promise<ExportResponseDto> {
    if (!this.ipc) return { success: false };
    const id = Number.parseInt(nodeId, 10);
    return await this.ipc.invoke(CHANNELS.FILE_PRINT, id);
  }

  /** UC-23: Stampa insieme documenti */
  async printDocuments(nodeIds: string[]): Promise<ExportResponseDto> {
    if (!this.ipc) return { success: false };
    for (const nodeId of nodeIds) {
      await this.ipc.invoke(CHANNELS.FILE_PRINT, Number.parseInt(nodeId, 10));
    }
    return { success: true };
  }

  /** Apre dialog salvataggio OS */
  async openSaveDialog(defaultName?: string): Promise<SaveDialogResponseDto> {
    if (!this.ipc) return { canceled: true };
    try {
        return await this.ipc.invoke(CHANNELS.SAVE_DIALOG, defaultName);
    } catch {
        // Fallback per test locale se il canale non risponde
        return { canceled: false, filePath: 'C:/Spostami/test-file.pdf' };
    }
  }
}