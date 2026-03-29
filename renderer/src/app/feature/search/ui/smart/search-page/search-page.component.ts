import { Component, inject, OnInit } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { SearchFacade } from '../../../services';
import { AdvancedFilterPanelComponent } from '../advanced-filter-panel/advanced-filter-panel';
import {
  SearchFilters,
  SearchQuery,
  ValidationResult,
} from '../../../../../../../../shared/metadata';
import { SearchQueryType } from '../../../../../../../../shared/metadata/search.enum';

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
    if (currentState.query.useSemanticSearch) {
      this.searchFacade.searchSemantic(currentState.query);
    } else {
      this.searchFacade.search();
    }
  }

  public onAdvancedSearchRequested(filters: SearchFilters): void {
    this.searchFacade.searchAdvanced(filters);
  }

  public onFiltersReset(): void {
    this.searchFacade.setFilters({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: null,
    } as any);
  }
}
