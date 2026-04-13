import { Injectable, WritableSignal, signal, Signal, Inject } from '@angular/core';
import { ISearchFacade } from '../contracts/search-facade.interface';
import {
  SearchFilters,
  SearchQuery,
  SearchState,
  ValidationError,
  ValidationResult,
  PartialSearchFilters,
  ISearchResult,
} from '../../../../../../shared/domain/metadata';
import { SearchQueryType } from '../../../../../../shared/domain/metadata/search.enum';
import {
  IErrorHandler,
  ITelemetry,
  ILiveAnnouncer,
  ERROR_HANDLER_TOKEN,
  TELEMETRY_TOKEN,
  LIVE_ANNOUNCER_TOKEN,
} from '../../../shared/contracts';
import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import {
  ISemanticIndexStatus,
  SEMANTIC_INDEX_STATUS_TOKEN,
} from '../contracts/semantic-index.interface';
import {
  IFilterValidator,
  FILTER_VALIDATOR_TOKEN,
} from '../../validation/contracts/filter-validator.interface';
import { firstValueFrom, Subject } from 'rxjs';
import { ISearchChannel, SEARCH_CHANNEL_TOKEN } from '../contracts/search-channel.interface';
import { TelemetryEvent } from '../../../shared/domain';
import { hasMeaningfulAdvancedFilters } from '../adapters/search-request.mapper';

@Injectable({ providedIn: 'root' })
export class SearchFacade implements ISearchFacade {
  private readonly state: WritableSignal<SearchState> = signal({
    query: { text: '', type: SearchQueryType.FREE, useSemanticSearch: false },
    filters: {
      common: {} as any,
      diDai: {} as any,
      aggregate: {} as any,
      customMeta: {} as any,
      subject: [],
    },
    results: [],
    loading: false,
    isSearching: false,
    error: null,
    validationErrors: new Map(),
  });

  private abortController: AbortController | null = null;
  private readonly customMetadataKeys = signal<string[]>([]);
  private readonly searchTrigger = new Subject<void>();

  constructor(
    @Inject(SEARCH_CHANNEL_TOKEN) private readonly ipcGateway: ISearchChannel,
    @Inject(FILTER_VALIDATOR_TOKEN) private readonly filterValidator: IFilterValidator,
    @Inject(ERROR_HANDLER_TOKEN) private readonly errorHandler: IErrorHandler,
    @Inject(TELEMETRY_TOKEN) private readonly telemetryService: ITelemetry,
    @Inject(SEMANTIC_INDEX_STATUS_TOKEN) private readonly semanticIndexStatus: ISemanticIndexStatus,
    @Inject(LIVE_ANNOUNCER_TOKEN) private readonly liveAnnouncer: ILiveAnnouncer,
  ) {
    this.searchTrigger.pipe(debounceTime(300)).subscribe(() => this.executeFullTextSearch());
  }

  public getState(): Signal<SearchState> {
    return this.state.asReadonly();
  }

  public getCustomMetadataKeys(): Signal<string[]> {
    return this.customMetadataKeys.asReadonly();
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

    if (!this.validateAndStoreErrors(this.state().filters as unknown as PartialSearchFilters)) {
      return;
    }

    this.searchTrigger.next();
  }

  public searchAdvanced(filters: SearchFilters): void {
    this.setFilters(filters);

    if (!this.validateAndStoreErrors(filters as unknown as PartialSearchFilters)) {
      return;
    }

    if (!hasMeaningfulAdvancedFilters(filters)) {
      this.state.update((s) => ({
        ...s,
        validationErrors: new Map(),
        results: [],
        loading: false,
        isSearching: false,
      }));
      return;
    }

    this.executeAdvancedSearch(filters);
  }

  public searchSemantic(query: SearchQuery): void {
    const currentSemanticStatus = this.semanticIndexStatus.getStatus()();
    if (currentSemanticStatus.status !== 'READY') {
      return;
    }

    this.setQuery(query);

    if (!this.validateAndStoreErrors(this.state().filters as unknown as PartialSearchFilters)) {
      return;
    }

    this.executeSemanticSearch(query);
  }

  public validateFilters(filters: PartialSearchFilters): ValidationResult {
    return this.filterValidator.validate(filters);
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

  public async loadCustomMetadataKeys(dipId: number | null = null): Promise<void> {
    try {
      const keys = await firstValueFrom(
        this.ipcGateway.getCustomMetadataKeys(dipId, new AbortController().signal),
      );
      this.customMetadataKeys.set(Array.isArray(keys) ? keys : []);
    } catch {
      this.customMetadataKeys.set([]);
    }
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

  private handleSuccess(results: ISearchResult[]): void {
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

  private validateAndStoreErrors(filters: PartialSearchFilters): boolean {
    const validation = this.validateFilters(filters);
    this.state.update((s) => ({
      ...s,
      validationErrors: this.toValidationErrorMap(validation),
    }));
    return validation.isValid;
  }

  private toValidationErrorMap(validation: ValidationResult): Map<string, ValidationError> {
    if (validation.isValid) {
      return new Map();
    }

    const validationErrors = new Map<string, ValidationError>();
    validation.errors.forEach((errors: ValidationError[], key: string) => {
      const firstError = errors[0];
      if (firstError) {
        validationErrors.set(key, firstError);
      }
    });
    return validationErrors;
  }
}
