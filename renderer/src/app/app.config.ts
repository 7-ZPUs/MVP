import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs'; // Serve per mockare le chiamate IPC
import { signal } from '@angular/core';

import { routes } from './app.routes';
import { SearchFacade } from './feature/search/services'; // Aggiusta se serve

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Il tuo orchestratore reale
    { provide: 'ISearchFacade', useClass: SearchFacade },

    // --- MOCK TEMPORANEI PER VEDERE LA UI ---
    {
      provide: 'ISearchChannel',
      useValue: {
        search: () => of([]),
        searchAdvanced: () => of([]),
        searchSemantic: () => of([]),
      },
    },
    {
      provide: 'IFilterValidator',
      useValue: { validate: () => ({ isValid: true, errors: new Map() }) },
    },
    {
      provide: 'IErrorHandler',
      useValue: { handle: (e: any) => ({ message: 'Errore generico' }) },
    },
    { provide: 'ITelemetry', useValue: { trackEvent: () => {}, trackError: () => {} } },
    { provide: 'ISemanticIndexStatus', useValue: { getStatus: () => signal({ status: 'READY' }) } },
    { provide: 'ILiveAnnouncer', useValue: { announce: () => {} } },
    { provide: 'IRouter', useValue: { navigate: () => {} } },
  ],
};
