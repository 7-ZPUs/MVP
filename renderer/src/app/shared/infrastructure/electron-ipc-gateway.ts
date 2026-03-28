import { Injectable } from '@angular/core';
import { IIpcGateway, CachePolicy, IpcHandler } from '../interfaces/ipc-gateway.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ElectronIpcGateway implements IIpcGateway {
  async invoke<T = unknown>(channel: string, payload?: unknown, cachePolicy?: CachePolicy | null): Promise<T> {
    const electronApi = (window as any).electronAPI || (window as any).api;
    if (electronApi && typeof electronApi.invoke === 'function') {
      return electronApi.invoke(channel, payload);
    }
    
    console.warn(`[ElectronIpcGateway] MOCKING invoke for channel: ${channel}`);
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        if (channel === 'ipc:aggregate:get') {
          resolve({
            aggregateId: String(payload),
            metadata: {
              tipo: 'Fascicolo',
              id: String(payload),
              tipologiaFascicolo: 'Procedimento',
              assegnazione: 'Ufficio HR',
              dateApertura: '2023-01-01',
              progressivo: '123',
              posizioneFisica: 'Archivio 1',
              idPrimaria: 'ID-PRIM',
              conservazione: '10 anni'
            },
            documentIndex: [
              { tipo: 'Principale', identificativo: 'DOC-1' }
            ]
          } as any as T);
          return;
        }

        if (channel === 'ipc:document:get') {
          resolve({
            documentId: String(payload),
            fileName: 'documento.pdf',
            mimeType: 'PDF',
            metadata: {
              nome: 'Documento di Test',
              descrizione: 'Un documento mockato',
              tipoDocumentale: 'Circolare',
              modalitaFormazione: 'Nativa digitale',
              riservatezza: 'Nessuna',
              versione: '1.0'
            },
            registration: {
              flusso: 'E',
              tipoRegistro: 'Predefinito',
              data: '2023-01-01',
              numero: '001',
              codice: 'A'
            },
            classification: {
              indice: '1.2.3',
              descrizione: 'Test',
              uriPiano: '/uri'
            },
            format: {
              tipo: 'PDF',
              prodotto: 'Word',
              versione: '1.0',
              produttore: 'Microsoft'
            },
            verification: {
              firmaDigitale: 'Valida',
              sigillo: 'N/A',
              marcaturaTemporale: 'Presente',
              conformitaCopie: 'N/A'
            },
            attachments: {
              numero: 0
            },
            changeTracking: {
              tipo: 'Creazione',
              soggetto: 'Admin',
              data: '2023-01-01',
              idVersionePrecedente: ''
            },
            aipInfo: {
              classeDocumentale: 'A',
              uuid: 'AIP-1'
            },
            conservationProcess: {
              processo: 'P1',
              sessione: 'S1',
              dataInizio: '2023-02-01'
            }
          } as any as T);
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
