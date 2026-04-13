import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdvancedFilterPanelComponent } from '../advanced-filter-panel/advanced-filter-panel';
import { SearchResultsComponent } from '../../dumb/search-results.component/search-results.component';
import {
  SearchFilters,
  ISearchResult,
  SearchQuery,
  ValidationError,
  ValidationResult,
  PartialSearchFilters,
} from '../../../../../../../../shared/domain/metadata';
import { SearchBarComponent } from '../../dumb/search-bar.component/search-bar.component';
import {
  buildDetailRoute,
  mapSearchResultTypeToDetailItemType,
} from '../../../../navigation/domain/navigation-routing';
import { ISearchFacade, SEARCH_FACADE_TOKEN } from '../../../contracts/search-facade.interface';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [AdvancedFilterPanelComponent, SearchResultsComponent, SearchBarComponent],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPageComponent implements OnInit {
  protected readonly searchFacade: ISearchFacade = inject(SEARCH_FACADE_TOKEN);
  protected readonly router = inject(Router);
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

    if (currentState.query.useSemanticSearch) {
      this.searchFacade.searchSemantic(currentState.query);
    } else {
      this.searchFacade.search();
    }

    this.syncExternalValidationFromState();
  }

  public onAdvancedSearchRequested(filters: SearchFilters): void {
    this.searchFacade.searchAdvanced(filters);
    this.syncExternalValidationFromState();
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
    return this.searchFacade.validateFilters(filters);
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

  private syncExternalValidationFromState(): void {
    const validationErrors = this.state().validationErrors;

    if (validationErrors.size === 0) {
      this.externalValidation = null;
      return;
    }

    const errors = new Map<string, ValidationError[]>();
    validationErrors.forEach((error, key) => {
      errors.set(key, [error]);
    });

    this.externalValidation = {
      isValid: false,
      errors,
    };
    this.isSidebarCollapsed = false;
  }
}
