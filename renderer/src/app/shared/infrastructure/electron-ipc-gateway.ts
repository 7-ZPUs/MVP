import { Injectable } from '@angular/core';
import { IIpcGateway, CachePolicy, IpcHandler } from '../interfaces/ipc-gateway.interfaces';
import { IpcChannels } from '../../../../../shared/ipc-channels';

@Injectable({
  providedIn: 'root',
})
export class ElectronIpcGateway implements IIpcGateway {
  async invoke<T = unknown>(
    channel: string,
    payload?: unknown,
    cachePolicy?: CachePolicy | null,
  ): Promise<T> {
    const electronApi = (window as any).electronAPI || (window as any).api;
    if (electronApi && typeof electronApi.invoke === 'function') {
      return electronApi.invoke(channel, payload);
    }

    console.warn(`[ElectronIpcGateway] MOCKING invoke for channel: ${channel}`);
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        if (channel === IpcChannels.BROWSE_GET_PROCESS_BY_ID) {
          resolve({
            id: Number(payload),
            uuid: 'mock-process-uuid',
            integrityStatus: 'VALID',
            metadata: {
              name: 'Metadata',
              type: 'Object',
              value: [
                { name: 'Oggetto', type: 'String', value: 'Fascicolo di Gara Mock' },
                { name: 'TipologiaDocumentale', type: 'String', value: 'Bando' },
                { name: 'IndiceDiClassificazione', type: 'String', value: '1.2.3' },
              ],
            },
          } as any as T);
          return;
        }

        if (channel === IpcChannels.BROWSE_GET_DOCUMENT_BY_ID) {
          resolve({
            id: Number(payload),
            processId: 1,
            uuid: 'mock-doc-uuid',
            integrityStatus: 'VALID',
            metadata: {
              name: 'Metadata',
              type: 'Object',
              value: [
                { name: 'Nome', type: 'String', value: 'Determina di Approvazione.pdf' },
                { name: 'Oggetto', type: 'String', value: 'Approvazione Bando' },
                { name: 'TipologiaDocumentale', type: 'String', value: 'Determina' },
              ],
            },
          } as any as T);
          return;
        }

        if (channel === IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT) {
          resolve([
            { id: 999, documentId: Number(payload), isMain: true, filename: 'test.pdf' },
          ] as any as T);
          return;
        }

        if (channel === IpcChannels.BROWSE_GET_FILE_BUFFER_BY_ID) {
          resolve(new Uint8Array([37, 80, 68, 70, 45]) as any as T); // Minimal `%PDF-` buffer signature back as a binary
          return;
        }

        resolve({} as T);
      }, 300);
    });
  }

  on(channel: string, handler: IpcHandler): void {
    const electronApi = (window as any).electronAPI || (window as any).api;
    if (electronApi && typeof electronApi.receive === 'function') {
      electronApi.receive(channel, handler);
    } else if (electronApi && typeof electronApi.on === 'function') {
      electronApi.on(channel, handler);
    } else {
      console.warn(`[ElectronIpcGateway] No electronAPI.receive/on found for channel: ${channel}`);
    }
  }
}
