import { Component, Inject, WritableSignal, Signal, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBarComponent } from '../../dumb/search-bar.component/search-bar.component';
import { AdvancedFilterPanelComponent } from '../advanced-filter-panel/advanced-filter-panel';
import { SearchResultsComponent } from '../../dumb/search-results.component/search-results.component';

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
  ValidationError,
} from '../../../../../shared/domain/metadata';
import { AppError } from '../../../../../shared/domain';
import { SemanticIndexState } from '../../../../../shared/domain/metadata/semantic-filter-models';
import { ISubjectDetailStrategy } from '../../../../../shared/domain/metadata/search-subject-filters-models';
import { SubjectType } from '../../../../../shared/domain/metadata/search.enum';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, AdvancedFilterPanelComponent, SearchResultsComponent],
  templateUrl: './search-page.html',
  styleUrls: ['./search-page.scss'],
})
export class SearchPageComponent implements OnInit {
  public selectedDocumentId: WritableSignal<string | null> = signal(null);
  public viewerError: WritableSignal<AppError | null> = signal(null);
  public unsupportedMimeType: WritableSignal<string | null> = signal(null);

  public searchState: Signal<SearchState>;
  public indexingState: Signal<SemanticIndexState>;
  public isEmpty: Signal<boolean>;
  public validatorFn: FilterValidatorFn;
  public externalValidationResult: Signal<ValidationResult>;

  public strategyRegistry = new Map<SubjectType, ISubjectDetailStrategy>();

  /* istanbul ignore next */
  constructor(
    @Inject('ISearchFacade') private readonly searchFacade: ISearchFacade,
    @Inject('IRouter') private readonly router: IRouter,
    @Inject('ISemanticIndexStatus') private readonly semanticStatus: ISemanticIndexStatus,
    @Inject('IFilterValidator') private readonly filterValidator: IFilterValidator,
    // @Inject(SUBJECT_DETAIL_STRATEGIES) private strategies: SubjectStrategyProvider[] <-- Lo abiliteremo dopo
  ) {
    this.searchState = this.searchFacade.getState();
    this.indexingState = this.semanticStatus.getStatus();
    this.isEmpty = computed(() => this.searchState().results.length === 0);
    this.validatorFn = this.filterValidator.validate.bind(this.filterValidator);

    this.externalValidationResult = computed<ValidationResult>(() => {
      const errorsMap = this.searchState().validationErrors;
      const adaptedErrors = new Map<string, ValidationError[]>();

      if (errorsMap) {
        errorsMap.forEach((error, key) => {
          adaptedErrors.set(key, [error]);
        });
      }

      return {
        isValid: errorsMap ? errorsMap.size === 0 : true,
        errors: adaptedErrors,
      };
    });
  }

  public ngOnInit(): void {
    // Quando avremo il token SUBJECT_DETAIL_STRATEGIES, popoleremo la mappa qui:
    // this.strategies.forEach(provider => this.strategyRegistry.set(provider.type, provider.strategy));
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

  public onValidationResult(result: ValidationResult): void {}

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
