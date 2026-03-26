import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal, NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchPageComponent } from './search-page.component';
import {
  SearchFilters,
  SearchQuery,
  SearchQueryType,
  SearchResult,
  ValidationError,
  SearchState,
} from '../../../../../shared/domain/metadata';
import { AppError, ErrorCategory, ErrorSeverity } from '../../../../../shared/domain';

describe('SearchPageComponent', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;
  let mockSearchFacade: any;
  let mockRouter: any;
  let mockSemanticStatus: any;
  let mockFilterValidator: any;

  let mockStateSignal: WritableSignal<SearchState>;

  beforeEach(async () => {
    const defaultState: SearchState = {
      query: { text: '', type: SearchQueryType.FREE, useSemanticSearch: false },
      filters: { common: {}, diDai: {}, aggregate: {}, customMeta: [], subject: null } as any,
      results: [],
      loading: false,
      isSearching: false,
      error: null,
      validationErrors: new Map(),
    };

    mockStateSignal = signal(defaultState);

    mockSearchFacade = {
      getState: vi.fn().mockReturnValue(mockStateSignal),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      searchAdvanced: vi.fn(),
      retry: vi.fn(),
    };

    mockRouter = { navigate: vi.fn() };

    mockSemanticStatus = {
      getStatus: vi.fn().mockReturnValue(signal({ status: 'READY' })),
    };

    mockFilterValidator = {
      validate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        { provide: 'ISearchFacade', useValue: mockSearchFacade },
        { provide: 'IRouter', useValue: mockRouter },
        { provide: 'ISemanticIndexStatus', useValue: mockSemanticStatus },
        { provide: 'IFilterValidator', useValue: mockFilterValidator },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Esecuzione Pura Costruttore (Bypass TestBed per Coverage)', () => {
    it('dovrebbe attraversare tutte le righe del costruttore, inclusi i rami true/false dei computed', () => {
      // Usiamo lo stato completo anche qui per non far crashare i computed signal
      const mockRawSignal = signal({
        query: { text: '', type: SearchQueryType.FREE, useSemanticSearch: false },
        filters: {} as any,
        results: [] as SearchResult[],
        loading: false,
        isSearching: false,
        error: null,
        validationErrors: new Map(),
      } as SearchState);

      const rawFacade = { getState: vi.fn().mockReturnValue(mockRawSignal) } as any;
      const rawRouter = {} as any;
      const rawStatus = { getStatus: vi.fn().mockReturnValue(signal({ status: 'READY' })) } as any;
      const rawValidator = { validate: vi.fn() } as any;

      const rawComponent = new SearchPageComponent(rawFacade, rawRouter, rawStatus, rawValidator);

      expect(rawComponent.searchState).toBeDefined();
      expect(rawComponent.indexingState).toBeDefined();
      expect(rawComponent.validatorFn).toBeDefined();
      expect(rawComponent.selectedDocumentId()).toBeNull();

      expect(rawComponent.isEmpty()).toBe(true);

      mockRawSignal.update((state) => ({
        ...state,
        results: [{ documentId: 'DOC-1' } as SearchResult],
      }));
      expect(rawComponent.isEmpty()).toBe(false);
    });
  });

  describe('Inizializzazione e Computed Signals', () => {
    it('dovrebbe inizializzare i signal di stato correttamente', () => {
      expect(component.selectedDocumentId()).toBeNull();
      expect(component.viewerError()).toBeNull();
      expect(component.unsupportedMimeType()).toBeNull();
      expect(component.isEmpty()).toBe(true);
      expect(component.validatorFn).toBeDefined();
    });

    it('dovrebbe aggiornare reattivamente isEmpty() a false quando ci sono risultati', () => {
      expect(component.isEmpty()).toBe(true);
      mockStateSignal.update((state) => ({
        ...state,
        results: [{ documentId: 'DOC-1' } as SearchResult],
      }));
      expect(component.isEmpty()).toBe(false);
    });

    it('externalValidationResult dovrebbe restituire isValid: true se non ci sono validationErrors nello stato', () => {
      // validationErrors è già un Map() vuoto dal defaultState
      const result = component.externalValidationResult();
      expect(result.isValid).toBe(true);
      expect(result.errors.size).toBe(0);
    });

    it('externalValidationResult dovrebbe mappare correttamente i ValidationErrors in array e calcolare isValid: false', () => {
      const mockErrorsMap = new Map<string, ValidationError>();
      mockErrorsMap.set('titolo', { field: 'titolo', message: 'Errore', code: 'ERR' });

      mockStateSignal.update((state) => ({ ...state, validationErrors: mockErrorsMap }));

      const result = component.externalValidationResult();

      expect(result.isValid).toBe(false);
      expect(result.errors.size).toBe(1);
      expect(result.errors.get('titolo')).toEqual([
        { field: 'titolo', message: 'Errore', code: 'ERR' },
      ]);
    });

    it('validatorFn dovrebbe invocare correttamente il validate() del servizio originale', () => {
      const mockFilters = { common: { text: 'test' } } as any;
      component.validatorFn(mockFilters);
      expect(mockFilterValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockFilterValidator.validate).toHaveBeenCalledWith(mockFilters);
    });
  });

  describe('Event Handlers: Ricerca e Filtri', () => {
    it('onQueryChanged() dovrebbe chiamare setQuery sulla Facade', () => {
      const query: SearchQuery = {
        text: 'test',
        type: SearchQueryType.FREE,
        useSemanticSearch: false,
      };
      component.onQueryChanged(query);
      expect(mockSearchFacade.setQuery).toHaveBeenCalledWith(query);
    });

    it('onFiltersChanged() dovrebbe chiamare setFilters sulla Facade', () => {
      const filters = {} as SearchFilters;
      component.onFiltersChanged(filters);
      expect(mockSearchFacade.setFilters).toHaveBeenCalledWith(filters);
      expect(mockSearchFacade.searchAdvanced).not.toHaveBeenCalled();
    });

    it('onFiltersSubmit() dovrebbe chiamare searchAdvanced sulla Facade', () => {
      const filters = { common: { text: 'submit' } } as unknown as SearchFilters;
      component.onFiltersSubmit(filters);
      expect(mockSearchFacade.searchAdvanced).toHaveBeenCalledWith(filters);
    });

    it('onRetrySearch() dovrebbe chiamare retry() sulla Facade', () => {
      component.onRetrySearch();
      expect(mockSearchFacade.retry).toHaveBeenCalled();
    });

    it('onValidationResult() dovrebbe eseguire senza errori', () => {
      const mockValidationResult = { isValid: true, errors: new Map() };
      expect(() => component.onValidationResult(mockValidationResult)).not.toThrow();
    });
  });

  describe('Event Handlers: Document Viewer', () => {
    it('onResultSelected() dovrebbe impostare selectedDocumentId e pulire gli errori del viewer', () => {
      component.viewerError.set({
        code: 'DOC_ERR',
        category: ErrorCategory.IPC,
        severity: ErrorSeverity.ERROR,
        recoverable: true,
        message: 'Not found',
        source: 'test',
        context: null,
        detail: null,
      } as unknown as AppError);
      component.unsupportedMimeType.set('video/mp4');

      component.onResultSelected('DOC-99');

      expect(component.selectedDocumentId()).toBe('DOC-99');
      expect(component.viewerError()).toBeNull();
      expect(component.unsupportedMimeType()).toBeNull();
    });

    it('onViewerError() dovrebbe aggiornare il signal viewerError', () => {
      const mockAppError = { code: 'DOC_ERR', message: 'Not found' } as unknown as AppError;
      component.onViewerError(mockAppError);
      expect(component.viewerError()).toEqual(mockAppError);
    });

    it('onUnsupportedFormat() dovrebbe aggiornare il signal unsupportedMimeType', () => {
      component.onUnsupportedFormat('application/unknown');
      expect(component.unsupportedMimeType()).toBe('application/unknown');
    });

    it('onViewerRetry() dovrebbe pulire il viewerError', () => {
      component.viewerError.set({
        code: 'DOC_ERR',
        category: ErrorCategory.IPC,
        severity: ErrorSeverity.ERROR,
        recoverable: true,
        message: 'Not found',
        source: 'test',
        context: null,
        detail: null,
      } as unknown as AppError);
      component.onViewerRetry();
      expect(component.viewerError()).toBeNull();
    });
  });
  describe('Forzatura Copertura Template HTML e OnInit (Regola di Bland)', () => {
    it('dovrebbe eseguire ngOnInit coprendo la riga TS mancante', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('dovrebbe innescare gli eventi di output di app-search-bar', () => {
      const bar = fixture.debugElement.query(By.css('app-search-bar'));
      const spy = vi.spyOn(component, 'onQueryChanged');
      bar.triggerEventHandler('queryChanged', { text: 'test' });
      expect(spy).toHaveBeenCalled();
    });

    it('dovrebbe innescare gli eventi di output di app-advanced-filter-panel', () => {
      const panel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));

      const changeSpy = vi.spyOn(component, 'onFiltersChanged');
      panel.triggerEventHandler('filtersChanged', { common: {} });
      expect(changeSpy).toHaveBeenCalled();

      const submitSpy = vi.spyOn(component, 'onFiltersSubmit');
      panel.triggerEventHandler('filtersSubmit', { common: {} });
      expect(submitSpy).toHaveBeenCalled();

      const validSpy = vi.spyOn(component, 'onValidationResult');
      panel.triggerEventHandler('validationResult', { isValid: true, errors: new Map() });
      expect(validSpy).toHaveBeenCalled();
    });

    it('dovrebbe mostrare il global-loader quando loading è true', () => {
      mockStateSignal.update((s) => ({ ...s, loading: true }));
      fixture.detectChanges();
      const loader = fixture.debugElement.query(By.css('.global-loader'));
      expect(loader).toBeTruthy();
    });

    it('dovrebbe mostrare il global-error, innescare il click su Riprova e coprire app-search-results', () => {
      // 1. Copriamo l'errore globale
      mockStateSignal.update((s) => ({
        ...s,
        loading: false,
        error: { code: 'ERR', message: 'Test IPC' } as unknown as AppError,
      }));
      fixture.detectChanges();

      const errorDiv = fixture.debugElement.query(By.css('.global-error'));
      expect(errorDiv).toBeTruthy();

      const retryBtn = errorDiv.query(By.css('button'));
      const retrySpy = vi.spyOn(component, 'onRetrySearch');
      retryBtn.triggerEventHandler('click', null);
      expect(retrySpy).toHaveBeenCalled();
      mockStateSignal.update((s) => ({ ...s, error: null }));
      fixture.detectChanges();

      const resultsList = fixture.debugElement.query(By.css('app-search-results'));
      const selectSpy = vi.spyOn(component, 'onResultSelected');
      resultsList.triggerEventHandler('resultSelected', 'DOC-99');
      expect(selectSpy).toHaveBeenCalledWith('DOC-99');
    });

    it('dovrebbe mostrare il document-viewer-modal e cliccare tutti i suoi bottoni interni', () => {
      component.selectedDocumentId.set('DOC-123');
      fixture.detectChanges();

      const modal = fixture.debugElement.query(By.css('.document-viewer-modal'));
      expect(modal).toBeTruthy();

      // Clicchiamo "Chiudi" sull'header
      const closeBtn = modal.query(By.css('.viewer-header button'));
      closeBtn.triggerEventHandler('click', null);
      expect(component.selectedDocumentId()).toBeNull(); // Verifica che il set(null) inline abbia funzionato

      // Riattiviamo per coprire la sezione errori del viewer
      component.selectedDocumentId.set('DOC-123');
      component.viewerError.set({ code: 'ERR', message: 'Fail' } as unknown as AppError);
      component.unsupportedMimeType.set('video/mp4');
      fixture.detectChanges();

      // Clicchiamo "Riprova" nel body del viewer
      const retryViewerBtn = modal.query(By.css('.viewer-body button'));
      const retryViewerSpy = vi.spyOn(component, 'onViewerRetry');
      retryViewerBtn.triggerEventHandler('click', null);
      expect(retryViewerSpy).toHaveBeenCalled();
    });
  });
});
