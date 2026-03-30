import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // Assicurati che qui ci sia la rotta alla SearchPageComponent
import { ELECTRON_CONTEXT_BRIDGE_TOKEN } from './shared/contracts'; // Usa il path corretto per la tua app

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // Agganciamo l'interfaccia Angular all'oggetto reale di Electron
    {
      provide: ELECTRON_CONTEXT_BRIDGE_TOKEN,
      useFactory: () => {
        // electronAPI è il nome esposto dal preload.ts
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          return (window as any).electronAPI;
        }

        // Fallback se apri il progetto nel browser web normale invece che in Electron
        return {
          invoke: () =>
            Promise.reject(
              new Error(
                'Ponte Electron (electronAPI) non trovato. Stai eseguendo app in un browser web?',
              ),
            ),
        };
      },
    },
  ],
};
