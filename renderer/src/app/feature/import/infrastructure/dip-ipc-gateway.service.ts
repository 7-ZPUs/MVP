import { Injectable } from '@angular/core';
import { ClasseDocumentaleDto, DipTreeNodeDto } from '../domain/dtos';
import { IDipChannel } from '../contracts/i-dip-channel';

// Definiamo i canali qui come stringhe per evitare errori di import "Module not found"
const CHANNELS = {
  BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID: 'browse:get-document-class-by-dip-id',
  BROWSE_GET_DOCUMENTS_BY_PROCESS: 'browse:get-documents-by-process',
  FILE_DOWNLOAD: 'file:download'
} as const;

@Injectable({ providedIn: 'root' })
export class DipIpcGateway implements IDipChannel {

  // Accede all'oggetto esposto dal preload di Electron
  private readonly ipc = (globalThis as any).electron;

  constructor() {
    if (!this.ipc) {
      console.warn("Electron Bridge non trovato. Se sei nel browser è normale, se sei in Electron controlla il preload.");
    }
  }

  // UC-1: Carica classi
  async getClasses(): Promise<ClasseDocumentaleDto[]> {
    if (!this.ipc) return [];
    return await this.ipc.invoke(CHANNELS.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID, 1);
  }

  // UC-2: Carica figli
  async loadChildren(nodeId: string): Promise<DipTreeNodeDto[]> {
    if (!this.ipc) return [];
    const id = Number.parseInt(nodeId, 10);
    return await this.ipc.invoke(CHANNELS.BROWSE_GET_DOCUMENTS_BY_PROCESS, id);
  }

  // UC-3: Download
  async downloadFile(nodeId: string): Promise<Blob> {
    if (!this.ipc) return new Blob();
    const id = Number.parseInt(nodeId, 10);
    const targetPath = 'C:/Downloads/file_scaricato.pdf'; 
    return await this.ipc.invoke(CHANNELS.FILE_DOWNLOAD, id, targetPath);
  }
}