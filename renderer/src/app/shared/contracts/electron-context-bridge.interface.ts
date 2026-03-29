import { InjectionToken } from '@angular/core';

export interface IElectronContextBridge {
  invoke<T>(channel: string, payload: unknown, signal?: AbortSignal): Promise<T>;
}

export const ELECTRON_CONTEXT_BRIDGE_TOKEN = new InjectionToken<IElectronContextBridge>(
  'IElectronContextBridge',
);
