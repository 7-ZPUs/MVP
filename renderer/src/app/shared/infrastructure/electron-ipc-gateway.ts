import { Injectable } from '@angular/core';
import { IIpcGateway, CachePolicy, IpcHandler } from '../interfaces/ipc-gateway.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ElectronIpcGateway implements IIpcGateway {
  async invoke<T = unknown>(
    channel: string,
    payload?: unknown,
    cachePolicy?: CachePolicy | null,
  ): Promise<T> {
    const electronApi = (globalThis as any).electronAPI || (globalThis as any).api;
    if (electronApi && typeof electronApi.invoke === 'function') {
      return electronApi.invoke(channel, payload);
    }

    throw new Error(
      `[ElectronIpcGateway] electronAPI non disponibile per il canale ${channel}. ` +
        'Verifica preload script e webPreferences.preload in Electron.',
    );
  }

  on(channel: string, handler: IpcHandler): void {
    const electronApi = (globalThis as any).electronAPI || (globalThis as any).api;
    if (electronApi && typeof electronApi.receive === 'function') {
      electronApi.receive(channel, handler);
    } else if (electronApi && typeof electronApi.on === 'function') {
      electronApi.on(channel, handler);
    } else {
      console.warn(`[ElectronIpcGateway] No electronAPI.receive/on found for channel: ${channel}`);
    }
  }
}
