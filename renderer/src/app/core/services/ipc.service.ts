import { Injectable } from '@angular/core';
import { IpcChannels, IpcChannel } from '../../../../../shared/ipc-channels';

@Injectable({
  providedIn: 'root'
})
export class IpcService {
  constructor() { }

  /**
   * Invoca un comando sul Main process.
   * Grazie al type typing obblighiamo a usare i canali conosciuti.
   */
  public async invoke<T>(channel: IpcChannel, data?: any): Promise<T> {
    if ((window as any).electronAPI) {
      return (window as any).electronAPI.invoke(channel, data);
    } else {
      throw new Error('electronAPI not available in window');
    }
  }
}
