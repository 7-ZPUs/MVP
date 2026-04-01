import { Component, inject, OnInit, Inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { SearchFacade } from '../../../services';
import { AdvancedFilterPanelComponent } from '../advanced-filter-panel/advanced-filter-panel';
import {
  SearchFilters,
  SearchQuery,
  ValidationResult,
  PartialSearchFilters,
} from '../../../../../../../../shared/domain/metadata';
import { SearchQueryType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { IFilterValidator } from '../../../../validation/contracts/filter-validator.interface';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [AdvancedFilterPanelComponent, JsonPipe],
  templateUrl: './search-page.html',
})
export class SearchPageComponent implements OnInit {
  protected readonly searchFacade = inject(SearchFacade);
  public readonly state = this.searchFacade.getState();
  public externalValidation: ValidationResult | null = null;

  constructor(@Inject('IFilterValidator') private readonly filterValidator: IFilterValidator) {}

  public ngOnInit(): void {}

  public onSearchTextChanged(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.searchFacade.setQuery({ ...this.state().query, text });
  }

  public onSearchTypeChanged(event: Event): void {
    const type = (event.target as HTMLSelectElement).value as SearchQueryType;
    this.searchFacade.setQuery({ ...this.state().query, type });
  }

  public onSemanticToggle(event: Event): void {
    const useSemanticSearch = (event.target as HTMLInputElement).checked;
    this.searchFacade.setQuery({ ...this.state().query, useSemanticSearch });
  }

  public onFiltersChanged(filters: SearchFilters): void {
    this.searchFacade.setFilters(filters);
  }

  public onSearchRequested(): void {
    const currentState = this.state();

    const validation = this.filterValidator.validate(
      currentState.filters as unknown as PartialSearchFilters,
    );
    this.externalValidation = validation;

    if (!validation.isValid) {
      return;
    }

    if (currentState.query.useSemanticSearch) {
      this.searchFacade.searchSemantic(currentState.query);
    } else {
      this.searchFacade.search();
    }
  }

  public onAdvancedSearchRequested(filters: SearchFilters): void {
    this.searchFacade.searchAdvanced(filters);

    const validationErrors = this.state().validationErrors;
    this.externalValidation = {
      isValid: validationErrors.size === 0,
      errors: new Map(Array.from(validationErrors.entries()).map(([key, value]) => [key, [value]])),
    };
  }

  public onFiltersReset(): void {
    this.searchFacade.setFilters({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: null,
    } as any);

    this.externalValidation = null;
  }

  public validateFilters = (filters: PartialSearchFilters): ValidationResult => {
    return this.filterValidator.validate(filters);
  };

  public onLiveValidationChanged(result: ValidationResult): void {
    this.externalValidation = result;
  }
}
