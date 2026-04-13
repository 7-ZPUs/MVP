import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchPageComponent } from './search-page.component';
import { SearchQueryType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { SearchState } from '../../../../../../../../shared/domain/metadata';
import { SearchBarComponent } from '../../dumb/search-bar.component/search-bar.component';
import { SEARCH_FACADE_TOKEN } from '../../../contracts/search-facade.interface';
import { FILTER_VALIDATOR_TOKEN } from '../../../../validation/contracts/filter-validator.interface';

describe('SearchPageComponent', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;
  let mockFacade: {
    getState: ReturnType<typeof vi.fn>;
    getCustomMetadataKeys: ReturnType<typeof vi.fn>;
    loadCustomMetadataKeys: ReturnType<typeof vi.fn>;
    setQuery: ReturnType<typeof vi.fn>;
    setFilters: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    searchAdvanced: ReturnType<typeof vi.fn>;
    searchSemantic: ReturnType<typeof vi.fn>;
    cancelSearch: ReturnType<typeof vi.fn>;
    retry: ReturnType<typeof vi.fn>;
  };
  let mockStateSignal: any;
  let mockFilterValidator: { validate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockStateSignal = signal<SearchState>({
      query: { text: '', type: SearchQueryType.FREE, useSemanticSearch: false },
      filters: { common: {}, diDai: {}, aggregate: {}, customMeta: null, subject: [] } as any,
      results: [],
      loading: false,
      isSearching: false,
      error: null,
      validationErrors: new Map(),
    });

    mockFacade = {
      getState: vi.fn().mockReturnValue(mockStateSignal),
      getCustomMetadataKeys: vi.fn().mockReturnValue(signal<string[]>([])),
      loadCustomMetadataKeys: vi.fn().mockResolvedValue(undefined),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      search: vi.fn(),
      searchAdvanced: vi.fn(),
      searchSemantic: vi.fn(),
      cancelSearch: vi.fn(),
      retry: vi.fn(),
      validateFilters: vi.fn().mockReturnValue({ isValid: true, errors: new Map() }),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        { provide: SEARCH_FACADE_TOKEN, useValue: mockFacade },
        { provide: FILTER_VALIDATOR_TOKEN, useValue: mockFilterValidator },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe crearsi correttamente e leggere lo stato iniziale', () => {
    expect(component).toBeTruthy();
    expect(mockFacade.getState).toHaveBeenCalled();
    expect(mockFacade.loadCustomMetadataKeys).toHaveBeenCalledWith();
  });

  describe('Interazione con la Barra di Ricerca (Eventi DOM)', () => {
    it('dovrebbe aggiornare la query intercettando (queryChanged) dalla search-bar', () => {
      const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
      searchBar.triggerEventHandler('queryChanged', {
        text: 'test',
        type: 'FREE',
        useSemanticSearch: false,
      });
      expect(mockFacade.setQuery).toHaveBeenCalled();
    });

    it('dovrebbe lanciare la ricerca intercettando (searchRequested) dalla search-bar', () => {
      const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
      searchBar.triggerEventHandler('searchRequested', null);
      expect(mockFacade.search).toHaveBeenCalled();
    });
  });

  describe('Orchestrazione della Ricerca', () => {
    it('dovrebbe chiamare searchSemantic se useSemanticSearch è true', () => {
      mockStateSignal.update((s: SearchState) => ({
        ...s,
        query: { ...s.query, useSemanticSearch: true },
      }));
      component.onSearchRequested();
      expect(mockFacade.searchSemantic).toHaveBeenCalled();
      expect(mockFacade.search).not.toHaveBeenCalled();
    });

    it('dovrebbe chiamare search se useSemanticSearch è false', () => {
      mockStateSignal.update((s: SearchState) => ({
        ...s,
        query: { ...s.query, useSemanticSearch: false },
      }));
      component.onSearchRequested();

      expect(mockFacade.search).toHaveBeenCalled();
      expect(mockFacade.searchSemantic).not.toHaveBeenCalled();
    });

    it('dovrebbe mostrare externalValidation se la facade espone errori di validazione nello stato', () => {
      const validationError = {
        field: 'aggregate.dataApertura',
        code: 'ERR_RANGE_001',
        message: 'La data di inizio non può essere successiva alla data di fine.',
      };

      mockStateSignal.update((s: SearchState) => ({
        ...s,
        validationErrors: new Map([['aggregate.dataApertura', validationError as any]]),
      }));

      component.onSearchRequested();

      expect(component.externalValidation?.isValid).toBe(false);
      expect(component.externalValidation?.errors.get('aggregate.dataApertura')?.[0]).toEqual(
        validationError,
      );
      expect(mockFacade.search).toHaveBeenCalled();
    });

    it('validateFilters() dovrebbe delegare alla facade', () => {
      const filters = { common: {}, diDai: {}, aggregate: {}, customMeta: null } as any;
      component.validateFilters(filters);
      expect(mockFacade.validateFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe('Interazione con i Filtri (Eventi DOM)', () => {
    it('dovrebbe passare i nuovi filtri alla facade intercettando (filtersChanged) dal figlio', () => {
      const mockFilters = { common: { text: 'prova' } } as any;
      const filterPanel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));

      filterPanel.triggerEventHandler('filtersChanged', mockFilters);

      expect(mockFacade.setFilters).toHaveBeenCalledWith(mockFilters);
    });

    it('dovrebbe resettare i filtri intercettando (filtersReset) dal figlio', () => {
      const filterPanel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));

      filterPanel.triggerEventHandler('filtersReset', null);

      expect(mockFacade.setFilters).toHaveBeenCalledWith({
        common: {},
        diDai: {},
        aggregate: {},
        customMeta: null,
        subject: [],
      });
    });

    it('dovrebbe intercettare (filtersSubmit) dal figlio ed eseguire la ricerca avanzata', () => {
      const mockFilters = { common: { text: 'test filtri' } } as any;
      const filterPanel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));

      filterPanel.triggerEventHandler('filtersSubmit', mockFilters);

      expect(mockFacade.searchAdvanced).toHaveBeenCalledWith(mockFilters);
      expect(mockFacade.search).not.toHaveBeenCalled();
    });

    it('dovrebbe aggiornare externalValidation intercettando (validationResult) dal figlio', () => {
      const filterPanel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));
      const result = {
        isValid: false,
        errors: new Map([
          [
            'aggregate.dataApertura',
            [{ field: 'aggregate.dataApertura', code: 'ERR_RANGE_001', message: 'range' }],
          ],
        ]),
      } as any;

      filterPanel.triggerEventHandler('validationResult', result);

      expect(component.externalValidation).toEqual(result);
    });
  });

  describe('Rendering Dinamico (Control Flow e Risultati)', () => {
    it('dovrebbe mostrare il loader se loading è true', () => {
      mockStateSignal.update((s: any) => ({ ...s, loading: true }));
      fixture.detectChanges();

      const loader = fixture.debugElement.query(By.css('.loading-container'));
      expect(loader).toBeTruthy();
      expect(loader.nativeElement.textContent).toContain('Ricerca in corso');
    });

    it('dovrebbe mostrare il box di errore se presente un errore nello stato', () => {
      mockStateSignal.update((s: any) => ({
        ...s,
        loading: false,
        error: new Error('Errore di Rete'),
      }));
      fixture.detectChanges();

      const errorBox = fixture.debugElement.query(By.css('.error-banner'));
      expect(errorBox).toBeTruthy();
      expect(errorBox.nativeElement.textContent).toContain('Errore di Rete');

      const retryBtn = fixture.debugElement.query(By.css('.btn-retry'));
      expect(retryBtn).toBeTruthy();
    });

    it('dovrebbe mostrare il messaggio "Nessun risultato" se array vuoto e query testuale presente', () => {
      mockStateSignal.update((s: any) => ({
        ...s,
        loading: false,
        error: null,
        results: [],
        query: { ...s.query, text: 'parola inesistente' },
      }));
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('Nessun risultato trovato');
    });

    it('dovrebbe mostrare i risultati se ci sono elementi trovati', () => {
      mockStateSignal.update((s: any) => ({
        ...s,
        loading: false,
        error: null,
        results: [{ documentId: '1', type: 'DOCUMENTO_INFORMATICO', title: 'Test Doc' }],
      }));
      fixture.detectChanges();

      const resultsComponent = fixture.debugElement.query(By.css('app-search-results'));
      expect(resultsComponent).toBeTruthy();

      const pageTitle = fixture.debugElement.query(By.css('.page-title'));
      expect(pageTitle.nativeElement.textContent).toContain('Trovati 1 risultati');
    });
  });
});
