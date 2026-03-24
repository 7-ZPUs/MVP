import { Component, Inject, WritableSignal, Signal, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ISearchFacade } from '../../../contracts/search-facade.interface';
import { IRouter } from '../../../../../shared/contracts';
import { ISemanticIndexStatus } from '../../../contracts/semantic-index.interface';
import { IFilterValidator } from '../../../../validation/contracts/filter-validator.interface';

import {
  SearchState,
  SearchQuery,
  SearchFilters,
  ValidationResult,
  FilterValidatorFn,
} from '../../../domain';
import { AppError } from '../../../../../shared/domain';
import { SemanticIndexState } from '../../../domain/semantic-filter-models';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule],
  template: ``,
})
export class SearchPageComponent {
  public selectedDocumentId: WritableSignal<string | null> = signal(null);
  public viewerError: WritableSignal<AppError | null> = signal(null);
  public unsupportedMimeType: WritableSignal<string | null> = signal(null);

  public searchState: Signal<SearchState>;
  public indexingState: Signal<SemanticIndexState>;
  public isEmpty: Signal<boolean>;
  public validatorFn: FilterValidatorFn;

  constructor(
    @Inject('ISearchFacade') private readonly searchFacade: ISearchFacade,
    @Inject('IRouter') private readonly router: IRouter,
    @Inject('ISemanticIndexStatus') private readonly semanticStatus: ISemanticIndexStatus,
    @Inject('IFilterValidator') private readonly filterValidator: IFilterValidator,
  ) {
    this.searchState = this.searchFacade.getState();
    this.indexingState = this.semanticStatus.getStatus();
    this.isEmpty = computed(() => this.searchState().results.length === 0);
    this.validatorFn = this.filterValidator.validate.bind(this.filterValidator);
  }

  public onQueryChanged(query: SearchQuery): void {
    this.searchFacade.setQuery(query);
  }

  public onFiltersChanged(filters: SearchFilters): void {
    this.searchFacade.setFilters(filters);
  }

  public onFiltersSubmit(filters: SearchFilters): void {
    this.searchFacade.searchAdvanced(filters);
  }

  public onValidationResult(result: ValidationResult): void {
    // Advisory only
  }

  public onResultSelected(documentId: string): void {
    this.selectedDocumentId.set(documentId);
    this.viewerError.set(null);
    this.unsupportedMimeType.set(null);
  }

  public onRetrySearch(): void {
    this.searchFacade.retry();
  }

  public onViewerError(err: AppError): void {
    this.viewerError.set(err);
  }

  public onViewerRetry(): void {
    this.viewerError.set(null);
  }

  public onUnsupportedFormat(mimeType: string): void {
    this.unsupportedMimeType.set(mimeType);
  }
}
