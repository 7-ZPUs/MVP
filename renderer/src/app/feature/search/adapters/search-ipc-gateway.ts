import { Injectable, Inject } from '@angular/core';
import { Observable, Observer, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ISearchChannel } from '../contracts/search-channel.interface';

import {
  ICacheService,
  CACHE_SERVICE_TOKEN,
  IErrorHandler,
  ERROR_HANDLER_TOKEN,
  IElectronContextBridge,
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
} from '../../../shared/contracts';
import {
  SearchQuery,
  SearchFilters,
  SearchResult,
} from '../../../../../../shared/metadata/search.models';

@Injectable({ providedIn: 'root' })
export class SearchIpcGateway implements ISearchChannel {
  // TTL per la cache impostato a 5 minuti (300.000 ms)
  private readonly CACHE_TTL_MS = 300_000;

  //searchProcesses, search
  constructor(
    @Inject(ELECTRON_CONTEXT_BRIDGE_TOKEN) private readonly contextBridge: IElectronContextBridge,
    @Inject(CACHE_SERVICE_TOKEN) private readonly cache: ICacheService,
    @Inject(ERROR_HANDLER_TOKEN) private readonly errorHandler: IErrorHandler,
  ) {}

  public search(q: SearchQuery, s: AbortSignal): Observable<SearchResult[]> {
    const cacheKey = `search:text:${JSON.stringify(q)}`;

    // 1. Controllo preventivo della cache
    const cached = this.cache.get<SearchResult[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    // 2. Chiamata IPC e aggiornamento della cache in caso di successo
    return this.invoke<SearchResult[]>('ipc:search:text', q, s, 'search:text').pipe(
      tap((results) => this.cache.set(cacheKey, results, this.CACHE_TTL_MS)),
    );
  }

  public searchAdvanced(f: SearchFilters, s: AbortSignal): Observable<SearchResult[]> {
    //Zaka's searchFilters
    const cacheKey = `search:advanced:${JSON.stringify(f)}`;

    const cached = this.cache.get<SearchResult[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.invoke<SearchResult[]>('ipc:search:advanced', f, s, 'search:advanced').pipe(
      tap((results) => this.cache.set(cacheKey, results, this.CACHE_TTL_MS)),
    );
  }

  public searchSemantic(q: SearchQuery, s: AbortSignal): Observable<SearchResult[]> {
    const cacheKey = `search:semantic:${JSON.stringify(q)}`;

    const cached = this.cache.get<SearchResult[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.invoke<SearchResult[]>('ipc:search:semantic', q, s, 'search:semantic').pipe(
      tap((results) => this.cache.set(cacheKey, results, this.CACHE_TTL_MS)),
    );
  }

  private cancelAndInvalidate(cacheKeyPrefix: string): void {
    // Rimuove i dati parziali o obsoleti dalla cache quando la chiamata viene interrotta
    this.cache.invalidatePrefix(cacheKeyPrefix);
  }

  private invoke<T>(
    channel: string,
    payload: unknown,
    signal: AbortSignal,
    cachePrefix: string,
  ): Observable<T> {
    return new Observable<T>((observer: Observer<T>) => {
      // Se il segnale è già stato interrotto prima ancora di iniziare
      if (signal.aborted) {
        this.cancelAndInvalidate(cachePrefix);
        observer.error(this.errorHandler.handle(new Error('AbortError')));
        return;
      }

      // Handler per l'interruzione in volo
      const onAbort = () => {
        this.cancelAndInvalidate(cachePrefix);
        observer.error(this.errorHandler.handle(new Error('AbortError')));
      };

      signal.addEventListener('abort', onAbort);

      // Esecuzione tramite Electron Bridge
      this.contextBridge
        .invoke<T>(channel, payload, signal)
        .then((result) => {
          if (!signal.aborted) {
            observer.next(result);
            observer.complete();
          }
        })
        .catch((err) => {
          if (!signal.aborted) {
            observer.error(this.errorHandler.handle(err));
          }
        })
        .finally(() => {
          // Pulizia del listener per evitare memory leak
          signal.removeEventListener('abort', onAbort);
        });
    });
  }
}
