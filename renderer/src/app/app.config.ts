import { ApplicationConfig, provideBrowserGlobalErrorListeners, signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SearchFacade } from './feature/search/services'; // Aggiusta se serve

// --- IMPORT REALI DA AGGIUNGERE ---
import { SearchIpcGateway } from './feature/search/adapters/search-ipc-gateway'; // Aggiusta il path
import { ELECTRON_CONTEXT_BRIDGE_TOKEN, CACHE_SERVICE_TOKEN } from './shared/contracts'; // Aggiusta il path

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    { provide: 'ISearchFacade', useClass: SearchFacade },

    // --- 1. IL PONTE REALE CON ELECTRON ---
    {
      provide: ELECTRON_CONTEXT_BRIDGE_TOKEN,
      useFactory: () => {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          return (window as any).electronAPI;
        }
        return {
          invoke: () =>
            Promise.reject(new Error('Ponte Electron non trovato. Esecuzione da browser?')),
        };
      },
    },

    // --- 2. IL CANALE DI RICERCA REALE ---
    {
      provide: 'ISearchChannel',
      useClass: SearchIpcGateway,
    },

    // --- 3. MOCK MANTENUTI PER LE INTERFACCE NON PRONTE ---
    {
      provide: 'IFilterValidator',
      useValue: { validate: () => ({ isValid: true, errors: new Map() }) },
    },
    {
      provide: 'IErrorHandler',
      useValue: { handle: (e: any) => ({ message: 'Errore generico' }) },
    },
    {
      provide: CACHE_SERVICE_TOKEN,
      useValue: { get: () => null, set: () => {}, invalidatePrefix: () => {} },
    },
    { provide: 'ITelemetry', useValue: { trackEvent: () => {}, trackError: () => {} } },
    { provide: 'ISemanticIndexStatus', useValue: { getStatus: () => signal({ status: 'READY' }) } },
    { provide: 'ILiveAnnouncer', useValue: { announce: () => {} } },
    { provide: 'IRouter', useValue: { navigate: () => {} } },
  ],
};
