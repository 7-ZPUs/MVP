import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs'; // Serve per mockare le chiamate IPC
import { signal } from '@angular/core';

import { SearchFacade } from './services';
import { routes } from './app.search.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    { provide: 'ISearchFacade', useClass: SearchFacade },
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
