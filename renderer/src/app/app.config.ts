import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { signal } from '@angular/core';
import { routes } from './app.routes';

import {
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
  LOGGING_CHANNEL_TOKEN,
} from './shared/contracts/index';

import { SearchIpcGateway } from './feature/search/adapters/search-ipc-gateway';
import { FilterValidatorService } from './feature/validation/services/filter-validator.service';
import { IpcErrorHandlerService } from './shared/services/ipc-error-handler.service';
import { TelemetryService } from './shared/services/telemetry.service';
import { LiveAnnouncerService } from './shared/services/live-announcer.service';
import { IpcCacheService } from './shared/services/ipc-cache.service';
import { ElectronLoggingGateway } from './shared/services/electron-logging-gateway';
import { SearchFacade } from './feature/search/services';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { IPC_GATEWAY_TOKEN } from './shared/interfaces/ipc-gateway.interfaces';
import { ElectronIpcGateway } from './shared/infrastructure/electron-ipc-gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(), // richiesto da @angular/cdk LiveAnnouncer
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    // Electron bridge
    {
      provide: ELECTRON_CONTEXT_BRIDGE_TOKEN,
      useFactory: () => {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          return (window as any).electronAPI;
        }
        return {
          invoke: () => Promise.reject(new Error('electronAPI non trovato')),
        };
      },
    },

    // Cache
    { provide: CACHE_SERVICE_TOKEN, useClass: IpcCacheService },

    // Logging
    { provide: LOGGING_CHANNEL_TOKEN, useClass: ElectronLoggingGateway },

    // Error handler
    { provide: ERROR_HANDLER_TOKEN, useClass: IpcErrorHandlerService },
    { provide: 'IErrorHandler', useClass: IpcErrorHandlerService },

    // Telemetry
    { provide: 'ITelemetry', useClass: TelemetryService },

    // Live announcer
    { provide: 'ILiveAnnouncer', useClass: LiveAnnouncerService },

    // Search channel
    { provide: 'ISearchChannel', useClass: SearchIpcGateway },

    // Filter validator
    { provide: 'IFilterValidator', useClass: FilterValidatorService },

    // Semantic index status — mock per ora
    {
      provide: 'ISemanticIndexStatus',
      useValue: { getStatus: () => signal({ status: 'READY' }) },
    },

    // Router
    { provide: 'IRouter', useValue: { navigate: () => {} } },

    // Facade
    { provide: 'ISearchFacade', useClass: SearchFacade },

    // IPC Gateway
    { provide: IPC_GATEWAY_TOKEN, useClass: ElectronIpcGateway },
  ],
};
