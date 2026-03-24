import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchPageComponent } from './search-page.component';
import { SearchFilters, SearchQuery, SearchQueryType, SearchResult } from '../../../domain';

describe('SearchPageComponent', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;
  let mockSearchFacade: any;
  let mockRouter: any;
  let mockSemanticStatus: any;
  let mockFilterValidator: any;

  // Manteniamo il riferimento al signal per poterlo pilotare nei test
  let mockStateSignal: WritableSignal<any>;

  beforeEach(async () => {
    mockStateSignal = signal({ results: [] as SearchResult[] });

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
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Esecuzione Pura Costruttore (Bypass TestBed per Coverage)', () => {
    it('dovrebbe attraversare tutte le righe del costruttore, inclusi i rami true/false del computed', () => {
      const mockRawSignal = signal({ results: [] as SearchResult[] });

      const rawFacade = { getState: vi.fn().mockReturnValue(mockRawSignal) } as any;
      const rawRouter = {} as any;
      const rawStatus = { getStatus: vi.fn().mockReturnValue(signal({ status: 'READY' })) } as any;
      const rawValidator = { validate: vi.fn() } as any;

      const rawComponent = new SearchPageComponent(rawFacade, rawRouter, rawStatus, rawValidator);

      expect(rawComponent.searchState).toBeDefined();
      expect(rawComponent.indexingState).toBeDefined();
      expect(rawComponent.validatorFn).toBeDefined();
      expect(rawComponent.selectedDocumentId()).toBeNull();

      // BRANCH 1: Verifichiamo il ramo "TRUE" della condizione (length === 0)
      expect(rawComponent.isEmpty()).toBe(true);

      // BRANCH 2: Inseriamo un dato per forzare il ramo "FALSE" della condizione (length !== 0)
      mockRawSignal.set({ results: [{ documentId: 'DOC-1' } as SearchResult] });
      expect(rawComponent.isEmpty()).toBe(false);
    });
  });

  describe('Inizializzazione', () => {
    it('dovrebbe inizializzare i signal di stato correttamente', () => {
      expect(component.selectedDocumentId()).toBeNull();
      expect(component.viewerError()).toBeNull();
      expect(component.unsupportedMimeType()).toBeNull();
      expect(component.isEmpty()).toBe(true);
      expect(component.validatorFn).toBeDefined();
    });

    it('dovrebbe aggiornare reattivamente isEmpty() a false quando ci sono risultati (copertura computed)', () => {
      // Verifichiamo lo stato iniziale
      expect(component.isEmpty()).toBe(true);

      // Pilotiamo il signal condiviso
      mockStateSignal.set({ results: [{ documentId: 'DOC-1' } as SearchResult] });

      // Il computed signal DEVE aggiornarsi
      expect(component.isEmpty()).toBe(false);
    });

    it('validatorFn dovrebbe invocare correttamente il validate() del servizio originale (copertura bind)', () => {
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

    it('onValidationResult() dovrebbe eseguire senza errori (copertura metodo advisory)', () => {
      const mockValidationResult = { isValid: true, errors: new Map() };
      expect(() => component.onValidationResult(mockValidationResult)).not.toThrow();
    });
  });

  describe('Event Handlers: Document Viewer', () => {
    it('onResultSelected() dovrebbe impostare selectedDocumentId e pulire gli errori del viewer', () => {
      component.viewerError.set({ code: 'ERR', message: 'test' } as any);
      component.unsupportedMimeType.set('video/mp4');

      component.onResultSelected('DOC-99');

      expect(component.selectedDocumentId()).toBe('DOC-99');
      expect(component.viewerError()).toBeNull();
      expect(component.unsupportedMimeType()).toBeNull();
    });

    it('onViewerError() dovrebbe aggiornare il signal viewerError', () => {
      const mockAppError = { code: 'DOC_ERR', message: 'Not found' } as any;
      component.onViewerError(mockAppError);
      expect(component.viewerError()).toEqual(mockAppError);
    });

    it('onUnsupportedFormat() dovrebbe aggiornare il signal unsupportedMimeType', () => {
      component.onUnsupportedFormat('application/unknown');
      expect(component.unsupportedMimeType()).toBe('application/unknown');
    });

    it('onViewerRetry() dovrebbe pulire il viewerError', () => {
      component.viewerError.set({ code: 'ERR', message: 'test' } as any);
      component.onViewerRetry();
      expect(component.viewerError()).toBeNull();
    });
  });
});
