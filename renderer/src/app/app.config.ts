import { ApplicationConfig, provideBrowserGlobalErrorListeners, signal } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

import {
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
  LOGGING_CHANNEL_TOKEN,
  TELEMETRY_TOKEN,
  LIVE_ANNOUNCER_TOKEN,
} from './shared/contracts/index';

import { SearchIpcGateway } from './features/search/adapters/search-ipc-gateway';
import { FilterValidatorService } from './features/validation/services/filter-validator.service';
import { IpcErrorHandlerService } from './shared/services/ipc-error-handler.service';
import { TelemetryService } from './shared/services/telemetry.service';
import { IpcCacheService } from './shared/infrastructure/ipc-cache.service';
import { ElectronLoggingGateway } from './shared/services/electron-logging-gateway';
import { SearchFacade } from './features/search/services';
import { IPC_GATEWAY_TOKEN } from './shared/interfaces/ipc-gateway.interfaces';
import { ElectronIpcGateway } from './shared/infrastructure/electron-ipc-gateway';
import { FILTER_VALIDATOR_TOKEN } from './features/validation/contracts/filter-validator.interface';
import { SEARCH_CHANNEL_TOKEN } from './features/search/contracts/search-channel.interface';
import { SEMANTIC_INDEX_STATUS_TOKEN } from './features/search/contracts/semantic-index.interface';
import { SEARCH_FACADE_TOKEN } from './features/search/contracts/search-facade.interface';
import { LiveAnnouncerService } from './shared/services/live-announcer.service';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    // Electron bridge./features/search/contracts/search-facade.interface
    {
      provide: ELECTRON_CONTEXT_BRIDGE_TOKEN,
      useFactory: () => {
        if (globalThis.window !== undefined) {
          const bridge =
            (globalThis.window as any).electronAPI ??
            (globalThis.window as any).api ??
            (globalThis.window as any).electron;

          if (bridge && typeof bridge.invoke === 'function') {
            return bridge;
          }
        }
        return {
          invoke: () =>
            Promise.reject(
              new Error(
                'electronAPI non trovato: verifica preload script e webPreferences.preload in Electron',
              ),
            ),
        };
      },
    },

    // Cache: token and class must resolve to the same singleton store instance.
    { provide: CACHE_SERVICE_TOKEN, useExisting: IpcCacheService },

    // Logging
    { provide: LOGGING_CHANNEL_TOKEN, useClass: ElectronLoggingGateway },

    // Error handler
    { provide: ERROR_HANDLER_TOKEN, useClass: IpcErrorHandlerService },

    // Telemetry
    { provide: TELEMETRY_TOKEN, useClass: TelemetryService },

    // Live announcer
    { provide: LIVE_ANNOUNCER_TOKEN, useClass: LiveAnnouncerService },

    // Search channel
    { provide: SEARCH_CHANNEL_TOKEN, useClass: SearchIpcGateway },

    // Filter validator
    { provide: FILTER_VALIDATOR_TOKEN, useClass: FilterValidatorService },

    // Semantic index status — mock per ora
    {
      provide: SEMANTIC_INDEX_STATUS_TOKEN,
      useValue: { getStatus: () => signal({ status: 'READY' }) },
    },

    // Facade
    { provide: SEARCH_FACADE_TOKEN, useClass: SearchFacade },

    // IPC Gateway
    { provide: IPC_GATEWAY_TOKEN, useClass: ElectronIpcGateway },
  ],
};
