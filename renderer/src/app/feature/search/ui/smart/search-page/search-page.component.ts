import { Component, inject, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchFacade } from '../../../services';
import { AdvancedFilterPanelComponent } from '../advanced-filter-panel/advanced-filter-panel';
import { SearchResultsComponent } from '../../dumb/search-results.component/search-results.component';
import {
  SearchFilters,
  SearchResult,
  SearchQuery,
  ValidationResult,
  PartialSearchFilters,
} from '../../../../../../../../shared/domain/metadata';
import { IFilterValidator } from '../../../../validation/contracts/filter-validator.interface';
import { SearchBarComponent } from '../../dumb/search-bar.component/search-bar.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [AdvancedFilterPanelComponent, SearchResultsComponent, SearchBarComponent],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPageComponent implements OnInit {
  protected readonly searchFacade = inject(SearchFacade);
  protected readonly router = inject(Router);
  public readonly state = this.searchFacade.getState();
  public externalValidation: ValidationResult | null = null;

  constructor(@Inject('IFilterValidator') private readonly filterValidator: IFilterValidator) {}

  public ngOnInit(): void {
    const currentState = this.state();
    
    if (!currentState.filters || currentState.filters.subject === undefined) {
    
      this.searchFacade.setFilters({
        common: currentState.filters?.common || {},
        diDai: currentState.filters?.diDai || {},
        aggregate: currentState.filters?.aggregate || {},
        customMeta: currentState.filters?.customMeta || null,
        subject: [], 
      } as any);
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
      subject: [],
    } as any);

    this.externalValidation = null;
  }

  public validateFilters = (filters: PartialSearchFilters): ValidationResult => {
    return this.filterValidator.validate(filters);
  };

  public onLiveValidationChanged(result: ValidationResult): void {
    this.externalValidation = result;
  }

  public onResultSelected(result: SearchResult): void {
    const id = result.documentId;

    const routingMap: Record<string, string> = {
      'AGGREGAZIONE_DOCUMENTALE': 'AGGREGATE',
      'DOCUMENTO_INFORMATICO': 'DOCUMENT',
      'DOCUMENTO_AMMINISTRATIVO_INFORMATICO': 'DOCUMENT',
      'PROCESSO': 'PROCESS',
      'CLASSE_DOCUMENTALE': 'CLASS'
    };
    
    const targetRoute = routingMap[result.type];

    if (!targetRoute) {
      console.warn(`Tipo di documento sconosciuto: ${result.type}. Impossibile determinare la rotta di destinazione.`);
      return;
    }
        
    this.router.navigate(['/detail/', targetRoute, id]);
  }
}
