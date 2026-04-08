import { Injectable, inject } from '@angular/core';
import { Observable, Observer, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
  SearchRequestDTO,
} from '../../../../../../shared/domain/metadata/search.models';
import { SearchQueryType } from '../../../../../../shared/domain/metadata/search.enum';
import { ISearchResult } from '../../../../../../shared/domain/metadata/search-result.models';
import { toSearchRequestDTO } from './search-request.mapper';

@Injectable({ providedIn: 'root' })
export class SearchIpcGateway implements ISearchChannel {
  private readonly CACHE_TTL_MS = 300_000;
  private readonly contextBridge: IElectronContextBridge = inject(ELECTRON_CONTEXT_BRIDGE_TOKEN);
  private readonly cache: ICacheService = inject(CACHE_SERVICE_TOKEN);
  private readonly errorHandler: IErrorHandler = inject(ERROR_HANDLER_TOKEN);

  public search(q: SearchQuery, s: AbortSignal): Observable<ISearchResult[]> {
    const cacheKey = `search:text:${JSON.stringify(q)}`;

    // 1. Controllo preventivo della cache
    const cached = this.cache.get<ISearchResult[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    let fallbackType: 'CLASS' | 'PROCESS' | undefined;
    if (q.type === SearchQueryType.CLASS_NAME) {
      fallbackType = 'CLASS';
    } else if (q.type === SearchQueryType.PROCESS_ID) {
      fallbackType = 'PROCESS';
    }

    return this.invoke<ISearchResult[]>('ipc:search:text', q, s, 'search:text').pipe(
      map((results) => this.ensureResultType(results, fallbackType)),
      tap((results) => this.cache.set(cacheKey, results, this.CACHE_TTL_MS)),
    );
  }

  public searchAdvanced(f: SearchFilters, s: AbortSignal): Observable<ISearchResult[]> {
    const request: SearchRequestDTO | null = toSearchRequestDTO(f);
    if (!request) {
      return of([]);
    }

    const cacheKey = `search:advanced:${JSON.stringify(request)}`;

    const cached = this.cache.get<ISearchResult[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.invoke<ISearchResult[]>('ipc:search:advanced', request, s, 'search:advanced').pipe(
      tap((results) => this.cache.set(cacheKey, results, this.CACHE_TTL_MS)),
    );
  }

  public searchSemantic(q: SearchQuery, s: AbortSignal): Observable<ISearchResult[]> {
    const cacheKey = `search:semantic:${JSON.stringify(q)}`;

    const cached = this.cache.get<ISearchResult[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.invoke<ISearchResult[]>('ipc:search:semantic', q, s, 'search:semantic').pipe(
      tap((results) => this.cache.set(cacheKey, results, this.CACHE_TTL_MS)),
    );
  }

  private cancelAndInvalidate(cacheKeyPrefix: string): void {
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
        observer.complete();
        return;
      }

      // Handler per l'interruzione in volo
      const onAbort = () => {
        this.cancelAndInvalidate(cachePrefix);
        observer.complete();
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

  private ensureResultType(results: ISearchResult[], fallbackType?: string): ISearchResult[] {
    if (!Array.isArray(results) || !fallbackType) {
      return results;
    }

    return results.map((result) => {
      if ((result as any)?.type) {
        return result;
      }

      return {
        ...result,
        type: fallbackType as ISearchResult['type'],
      } as ISearchResult;
    });
  }
}
