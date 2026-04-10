import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchFacade } from '../../../services';
import { AdvancedFilterPanelComponent } from '../advanced-filter-panel/advanced-filter-panel';
import { SearchResultsComponent } from '../../dumb/search-results.component/search-results.component';
import {
  SearchFilters,
  ISearchResult,
  SearchQuery,
  ValidationResult,
  PartialSearchFilters,
} from '../../../../../../../../shared/domain/metadata';
import {
  IFilterValidator,
  FILTER_VALIDATOR_TOKEN,
} from '../../../../validation/contracts/filter-validator.interface';
import { SearchBarComponent } from '../../dumb/search-bar.component/search-bar.component';
import {
  buildDetailRoute,
  mapSearchResultTypeToDetailItemType,
} from '../../../../navigation/domain/navigation-routing';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [AdvancedFilterPanelComponent, SearchResultsComponent, SearchBarComponent],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPageComponent implements OnInit {
  protected readonly searchFacade = inject(SearchFacade);
  protected readonly router = inject(Router);
  private readonly filterValidator: IFilterValidator = inject(FILTER_VALIDATOR_TOKEN);
  public readonly state = this.searchFacade.getState();
  public readonly customMetadataKeys = this.searchFacade.getCustomMetadataKeys();
  public externalValidation: ValidationResult | null = null;

  public isSidebarCollapsed = false;

  public ngOnInit(): void {
    const currentState = this.state();
    void this.searchFacade.loadCustomMetadataKeys();

    if (currentState.filters?.subject === undefined) {
      this.searchFacade.setFilters({
        common: currentState.filters?.common || {},
        diDai: currentState.filters?.diDai || {},
        aggregate: currentState.filters?.aggregate || {},
        customMeta: currentState.filters?.customMeta || null,
        subject: [],
      } as unknown as SearchFilters);
    }
  }

  public onQueryChanged(query: SearchQuery): void {
    this.searchFacade.setQuery(query);
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
      this.isSidebarCollapsed = false;
      return;
    }

    if (currentState.query.useSemanticSearch) {
      this.searchFacade.searchSemantic(currentState.query);
    } else {
      this.searchFacade.search();
    }
  }

  public onAdvancedSearchRequested(filters: SearchFilters): void {
    const validation = this.filterValidator.validate(filters as unknown as PartialSearchFilters);
    this.externalValidation = validation;
    if (!validation.isValid) {
      this.isSidebarCollapsed = false;
      return;
    }
    this.searchFacade.searchAdvanced(filters);
  }

  public onFiltersReset(): void {
    this.searchFacade.setFilters({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [],
    } as unknown as SearchFilters);

    this.externalValidation = null;
  }

  public validateFilters = (filters: PartialSearchFilters): ValidationResult => {
    return this.filterValidator.validate(filters);
  };

  public onLiveValidationChanged(result: ValidationResult): void {
    this.externalValidation = result;
    if (result.isValid === false) {
      this.isSidebarCollapsed = false;
    }
  }

  public onResultSelected(result: ISearchResult): void {
    const id = result.id;

    const targetItemType = mapSearchResultTypeToDetailItemType(result.type);
    if (!targetItemType) {
      console.warn(
        `Tipo di documento non ancora supportato in navigazione: ${result.type}. Impossibile determinare la rotta di destinazione.`,
      );
      return;
    }

    void this.router.navigate(buildDetailRoute(targetItemType, id));
  }
}
