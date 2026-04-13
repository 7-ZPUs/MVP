import { ApplicationConfig, provideBrowserGlobalErrorListeners, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs'; // Serve per mockare le chiamate IPC

import { SearchFacade } from './services';
import { routes } from './app.search.routes';
import { SEARCH_FACADE_TOKEN } from './contracts/search-facade.interface';
import { SEARCH_CHANNEL_TOKEN } from './contracts/search-channel.interface';
import {
  SEMANTIC_INDEX_STATUS_TOKEN,
} from './contracts/semantic-index.interface';
import { FILTER_VALIDATOR_TOKEN } from '../validation/contracts/filter-validator.interface';
import {
  ERROR_HANDLER_TOKEN,
  TELEMETRY_TOKEN,
  LIVE_ANNOUNCER_TOKEN,
  ROUTER_TOKEN,
} from '../../shared/contracts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    { provide: SEARCH_FACADE_TOKEN, useClass: SearchFacade },
    {
      provide: SEARCH_CHANNEL_TOKEN,
      useValue: {
        search: () => of([]),
        searchAdvanced: () => of([]),
        searchSemantic: () => of([]),
        getCustomMetadataKeys: () => of([]),
      },
    },
    {
      provide: FILTER_VALIDATOR_TOKEN,
      useValue: {
        validate: () => ({ isValid: true, errors: new Map() }),
        registerStrategy: () => {},
      },
    },
    {
      provide: ERROR_HANDLER_TOKEN,
      useValue: { handle: (e: any) => ({ message: 'Errore generico' }) },
    },
    { provide: TELEMETRY_TOKEN, useValue: { trackEvent: () => {}, trackError: () => {} } },
    {
      provide: SEMANTIC_INDEX_STATUS_TOKEN,
      useValue: { getStatus: () => signal({ status: 'READY' }) },
    },
    { provide: LIVE_ANNOUNCER_TOKEN, useValue: { announce: () => {} } },
    { provide: ROUTER_TOKEN, useValue: { navigate: () => Promise.resolve(true) } },
  ],
};
