import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { IPC_GATEWAY_TOKEN } from './shared/interfaces/ipc-gateway.interfaces';
import { ElectronIpcGateway } from './shared/infrastructure/electron-ipc-gateway';

import { LOGGING_CHANNEL_TOKEN } from './shared/contracts/logging-channel.interface';
import { ElectronLoggingGateway } from './shared/infrastructure/electron-logging-gateway';

import { ELECTRON_CONTEXT_BRIDGE_TOKEN } from './shared/contracts/electron-context-bridge.interface';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOGGING_CHANNEL_TOKEN, useClass: ElectronLoggingGateway },
    { provide: IPC_GATEWAY_TOKEN, useClass: ElectronIpcGateway },
    {
      provide: ELECTRON_CONTEXT_BRIDGE_TOKEN,
      useFactory: () => {
        const electronApi = (window as any).electronAPI || (window as any).api;

        // Browser Mock / Fallback
        if (!electronApi) {
          console.warn('[ElectronContextBridge] Running in browser, injecting mock api.');
          return {
            invoke: (channel: string, ...args: any[]) => {
              console.log(`[Mock Bridge] invoke: ${channel}`, args);
              return Promise.resolve();
            },
            on: (channel: string, func: any) => {
              console.log(`[Mock Bridge] on: ${channel}`);
            },
            once: (channel: string, func: any) => {
              console.log(`[Mock Bridge] once: ${channel}`);
            },
            removeListener: (channel: string, func: any) => {
              console.log(`[Mock Bridge] removeListener: ${channel}`);
            },
          };
        }

        return electronApi;
      },
    },
  ],
};
