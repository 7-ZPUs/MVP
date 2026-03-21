import { Injectable, WritableSignal, signal, Signal, Inject } from '@angular/core';
import { ISearchFacade } from '../contracts/search-facade.interface';
import {
  SearchFilters,
  SearchQuery,
  SearchState,
  ValidationError,
  PartialSearchFilters,
  SearchResult,
} from '../domain/search.models';
import { SearchQueryType } from '../domain/search.enum';
import { IErrorHandler, ITelemetry, ILiveAnnouncer } from '../../../shared/contracts';
import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import { ISemanticIndexStatus } from '../contracts/semantic-index.interface';
import { Subject } from 'rxjs/internal/Subject';
import { IFilterValidator } from '../../validation/contracts/filter-validator.interface';
import { firstValueFrom } from 'rxjs';
import { ISearchChannel } from '../contracts/search-channel.interface';
import { TelemetryEvent } from '../../../shared/domain/';

@Injectable({ providedIn: 'root' })
export class SearchFacade implements ISearchFacade {
  private readonly state: WritableSignal<SearchState> = signal({
    query: { text: '', type: SearchQueryType.FREE, useSemanticSearch: false },
    filters: {
      common: {} as any,
      diDai: {} as any,
      aggregate: {} as any,
      custom: [] as any,
      subject: null,
    },
    results: [],
    loading: false,
    isSearching: false,
    error: null,
    validationErrors: new Map(),
  });

  private abortController: AbortController | null = null;
  private readonly searchTrigger = new Subject<void>();

  constructor(
    @Inject('ISearchChannel') private readonly ipcGateway: ISearchChannel,
    @Inject('IFilterValidator') private readonly filterValidator: IFilterValidator,
    @Inject('IErrorHandler') private readonly errorHandler: IErrorHandler,
    @Inject('ITelemetry') private readonly telemetryService: ITelemetry,
    @Inject('ISemanticIndexStatus') private readonly semanticIndexStatus: ISemanticIndexStatus,
    @Inject('ILiveAnnouncer') private readonly liveAnnouncer: ILiveAnnouncer,
  ) {
    this.searchTrigger.pipe(debounceTime(300)).subscribe(() => this.executeFullTextSearch());
  }

  public getState(): Signal<SearchState> {
    return this.state.asReadonly();
  }

  public setQuery(query: SearchQuery): void {
    this.state.update((current) => ({ ...current, query }));
  }

  public setFilters(filters: SearchFilters): void {
    this.state.update((current) => ({ ...current, filters }));
  }

  // COMMANDS (CQS)
  public search(): void {
    if (this.state().isSearching) return;
    this.searchTrigger.next();
  }

  public searchAdvanced(filters: SearchFilters): void {
    this.setFilters(filters);

    const validation = this.filterValidator.validate(filters as unknown as PartialSearchFilters);

    if (!validation.isValid) {
      const validationErrors = new Map<string, ValidationError>();
      validation.errors.forEach((errors: ValidationError[], key: string) => {
        validationErrors.set(key, errors[0]);
      });
      this.state.update((s) => ({ ...s, validationErrors }));
      return;
    }

    this.state.update((s) => ({ ...s, validationErrors: new Map() }));
    this.executeAdvancedSearch(filters);
  }

  public searchSemantic(query: SearchQuery): void {
    const currentSemanticStatus = this.semanticIndexStatus.getStatus()();
    if (currentSemanticStatus.status !== 'READY') {
      return;
    }

    this.setQuery(query);
    this.executeSemanticSearch(query);
  }

  public cancelSearch(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.state.update((s) => ({ ...s, isSearching: false, loading: false }));
  }

  public retry(): void {
    this.search();
  }

  private async executeFullTextSearch(): Promise<void> {
    if (this.state().isSearching) return;

    this.prepareForSearch();
    try {
      const results = await firstValueFrom(
        this.ipcGateway.search(this.state().query, this.abortController!.signal),
      );
      this.handleSuccess(results);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.cleanupSearch();
    }
  }

  private async executeAdvancedSearch(filters: SearchFilters): Promise<void> {
    if (this.state().isSearching) return;

    this.prepareForSearch();
    try {
      const results = await firstValueFrom(
        this.ipcGateway.searchAdvanced(filters, this.abortController!.signal),
      );
      this.handleSuccess(results);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.cleanupSearch();
    }
  }

  private async executeSemanticSearch(query: SearchQuery): Promise<void> {
    if (this.state().isSearching) return;

    this.prepareForSearch();
    try {
      const results = await firstValueFrom(
        this.ipcGateway.searchSemantic(query, this.abortController!.signal),
      );
      this.handleSuccess(results);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.cleanupSearch();
    }
  }

  private prepareForSearch(): void {
    this.state.update((s) => ({ ...s, loading: true, isSearching: true, error: null }));

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
  }

  private handleSuccess(results: SearchResult[]): void {
    this.state.update((s) => ({ ...s, results }));
    this.telemetryService.trackEvent(TelemetryEvent.SEARCH_EXECUTED);
    this.liveAnnouncer.announce(`Trovati ${results.length} risultati`, 'polite');
  }

  private handleError(rawError: any): void {
    if (rawError?.name === 'AbortError') return;

    const appError = this.errorHandler.handle(rawError);
    this.state.update((s) => ({ ...s, error: appError }));
    this.telemetryService.trackError(appError);
  }

  private cleanupSearch(): void {
    this.abortController = null;
    this.state.update((s) => ({ ...s, loading: false, isSearching: false }));
  }
}
