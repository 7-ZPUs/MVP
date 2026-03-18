//import { defer, Observable, from, of, throwError } from 'rxjs';
//import { catchError, tap } from 'rxjs/operators';
//import { Injectable } from '@angular/core';
//
//import { ICacheService } from '../../../shared/contracts/cache-service.interface';
//import { IElectronContextBridge } from '../../../shared/contracts/electron-context-bridge.interface';
//import { ISearchChannel } from './search-channel.interface';
//import { SearchFilters, SearchQuery, SearchResult } from '../contracts/search.models';
//import { IErrorHandler } from '../../../shared/contracts/error-handler.interface';
//
//@Injectable({
//  providedIn: 'root',
//})
//export class SearchIpcGateway implements ISearchChannel {
//  constructor(
//    private readonly contextBridge: IElectronContextBridge,
//    private readonly cacheService: ICacheService,
//    private readonly errorHandler: IErrorHandler,
//  ) {}
//
//  public search(query: SearchQuery, signal: AbortSignal): Observable<SearchResult[]> {
//    const cacheKey = 'search:text:${query.text}';
//    return this.executeWithCache('ipc:search', query, signal, cacheKey);
//  }
//
//  public searchAdvanced(filters: SearchFilters, signal: AbortSignal): Observable<SearchResult[]> {
//    const cacheKey = 'search:advanced:${JSON.stringify(filters)}';
//    return this.executeWithCache('ipc:search:advanced', filters, signal, cacheKey);
//  }
//
//  public searchSemantic(query: SearchQuery, signal: AbortSignal): Observable<SearchResult[]> {
//    const cacheKey = 'search:semantic:${query.text}';
//    return this.executeWithCache('ipc:search:semantic', query, signal, cacheKey);
//  }
//
//  private cancelAndInvalidate(cacheKeyPrefix: string): void {
//    this.cacheService.invalidatePrefix(cacheKeyPrefix);
//  }
//
//  private invoke<T>(channel: string, payload: unknown, signal: AbortSignal): Observable<T> {
//    return from(this.contextBridge.invoke<T>(channel, payload, signal));
//  }
//
//  private executeWithCache(
//    channel: string,
//    payload: unknown,
//    signal: AbortSignal,
//    cacheKey: string,
//  ): Observable<SearchResult[]> {
//    return defer(() => {
//      // 1. Controllo in cache (Hit)
//      const cached = this.cacheService.get<SearchResult[]>(cacheKey);
//      if (cached) {
//        return of(cached);
//      }
//
//      const abortHandler = () => this.cancelAndInvalidate('search:');
//      signal.addEventListener('abort', abortHandler, { once: true });
//
//      return this.invoke<SearchResult[]>(channel, payload, signal).pipe(
//        tap((results) => {
//          signal.removeEventListener('abort', abortHandler);
//          this.cacheService.set(cacheKey, results, 300000);
//        }),
//        catchError((err) => {
//          signal.removeEventListener('abort', abortHandler);
//          return throwError(() => this.errorHandler.handle(err));
//        }),
//      );
//    });
//  }
//}
//
