import { Injectable } from '@angular/core';
import { IExportChannel } from '../contracts/i-export-channel';
import { ExportPdfResponseDto, ExportResponseDto, SaveDialogResponseDto } from '../domain/dtos';

// Mappiamo i canali reali visti nel FileViewerIpcAdapter dei tuoi compagni
const CHANNELS = {
  FILE_DOWNLOAD: 'file:download',    // UC-19 / UC-20
  FILE_PRINT:    'file:print',       // UC-22 / UC-23
  FILE_REPORT:   'file:report-pdf',  // UC-34 (ipotetico basato su struttura)
  SAVE_DIALOG:   'file:save-dialog'  // Canale per il dialog di sistema
} as const;

@Injectable({ providedIn: 'root' })
export class ExportIpcGateway implements IExportChannel {

  // Accesso diretto al bridge di Electron
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
    // Esegue i download in sequenza per sicurezza
    for (const nodeId of nodeIds) {
      await this.ipc.invoke(CHANNELS.FILE_DOWNLOAD, Number.parseInt(nodeId, 10), destPath);
    }
    return { success: true };
  }

  /** UC-34: Esporta report PDF */
  async exportReportPdf(reportId: string): Promise<ExportPdfResponseDto> {
    if (!this.ipc) return { success: false };
    // Usiamo il canale report se esiste, altrimenti un fallback
    return await this.ipc.invoke(CHANNELS.FILE_REPORT || 'file:report-pdf', reportId);
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
    // Se i tuoi compagni non hanno ancora questo canale, torniamo un path finto per test
    try {
        return await this.ipc.invoke(CHANNELS.SAVE_DIALOG, defaultName);
    } catch {
        return { canceled: false, filePath: 'C:/Spostami/test-file.pdf' };
    }
  }
}