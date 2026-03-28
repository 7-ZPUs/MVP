import { InjectionToken } from '@angular/core';

// Definiamo i tipi di supporto citati nel diagramma C4
// (Puoi espandere CachePolicy in base a come il tuo backend Electron gestisce la cache nativa, se la usa)
export type CachePolicy = 'none' | 'memory' | 'disk';
export type IpcHandler = (...args: any[]) => void;

/**
 * Contratto per la comunicazione con il processo Main di Electron.
 * Architettura DIP: Angular conosce solo questa interfaccia, non l'implementazione reale.
 */
export interface IIpcGateway {
  // Il metodo invoke per le chiamate standard (richiesta/risposta)
  // Usiamo Promise<T> perché le chiamate IPC in Electron sono sempre asincrone
  invoke<T = unknown>(
    channel: string,
    payload?: unknown,
    cachePolicy?: CachePolicy | null,
  ): Promise<T>;

  // Il metodo on per ascoltare eventi push dal backend (es. progresso download)
  on(channel: string, handler: IpcHandler): void;
}

// L'Injection Token che i Facade usano nei costruttori (es. @Inject(IPC_GATEWAY_TOKEN))
export const IPC_GATEWAY_TOKEN = new InjectionToken<IIpcGateway>('IIpcGateway');
