import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchPageComponent } from './search-page.component';
import { SearchFacade } from '../../../services';
import { SearchQueryType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { SearchState } from '../../../../../../../../shared/domain/metadata';

describe('SearchPageComponent', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;
  let mockFacade: any;
  let mockStateSignal: any;
  let mockFilterValidator: any;

  beforeEach(async () => {
    mockStateSignal = signal<SearchState>({
      query: { text: '', type: SearchQueryType.FREE, useSemanticSearch: false },
      filters: { common: {}, diDai: {}, aggregate: {}, customMeta: null, subject: null } as any,
      results: [],
      loading: false,
      isSearching: false,
      error: null,
      validationErrors: new Map(),
    });

    mockFacade = {
      getState: vi.fn().mockReturnValue(mockStateSignal),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      search: vi.fn(),
      searchAdvanced: vi.fn(),
      searchSemantic: vi.fn(),
      cancelSearch: vi.fn(),
      retry: vi.fn(),
    };

    mockFilterValidator = {
      validate: vi.fn().mockReturnValue({ isValid: true, errors: new Map() }),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        { provide: SearchFacade, useValue: mockFacade },
        { provide: 'IFilterValidator', useValue: mockFilterValidator },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe crearsi correttamente e leggere lo stato iniziale', () => {
    expect(component).toBeTruthy();
    expect(mockFacade.getState).toHaveBeenCalled();
  });

  describe('Interazione con la Barra di Ricerca (Eventi DOM)', () => {
    it("dovrebbe aggiornare il testo della query tramite l'evento (input) dell'HTML", () => {
      const textInput = fixture.debugElement.query(By.css('input[type="text"]'));
      textInput.triggerEventHandler('input', { target: { value: 'nuovo testo' } });

      expect(mockFacade.setQuery).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'nuovo testo' }),
      );
    });

    it("dovrebbe aggiornare il tipo di query tramite l'evento (change) della select", () => {
      const select = fixture.debugElement.query(By.css('select'));
      select.triggerEventHandler('change', { target: { value: 'PROCESS' } });

      expect(mockFacade.setQuery).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PROCESS' }),
      );
    });

    it("dovrebbe aggiornare il flag semantico tramite l'evento (change) del checkbox", () => {
      const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]'));
      checkbox.triggerEventHandler('change', { target: { checked: true } });

      expect(mockFacade.setQuery).toHaveBeenCalledWith(
        expect.objectContaining({ useSemanticSearch: true }),
      );
    });

    it("dovrebbe lanciare la ricerca alla pressione di invio sull'input", () => {
      const searchInput = fixture.debugElement.query(By.css('input[type="text"]'));
      searchInput.triggerEventHandler('keyup.enter', null);

      expect(mockFacade.search).toHaveBeenCalled();
    });

    it('dovrebbe lanciare la ricerca al click sul bottone Cerca', () => {
      const searchBtn = fixture.debugElement.query(By.css('header button'));
      searchBtn.triggerEventHandler('click', null);

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

    it('dovrebbe bloccare la ricerca principale e mostrare externalValidation se i filtri sono invalidi', () => {
      const validation = {
        isValid: false,
        errors: new Map([
          [
            'aggregate.dataApertura',
            [
              {
                field: 'aggregate.dataApertura',
                code: 'ERR_RANGE_001',
                message: 'La data di inizio non può essere successiva alla data di fine.',
              },
            ],
          ],
        ]),
      };
      mockFilterValidator.validate.mockReturnValue(validation);

      component.onSearchRequested();

      expect(component.externalValidation).toEqual(validation);
      expect(mockFacade.search).not.toHaveBeenCalled();
      expect(mockFacade.searchSemantic).not.toHaveBeenCalled();
    });

    it('dovrebbe validare i filtri prima della ricerca principale', () => {
      component.onSearchRequested();
      expect(mockFilterValidator.validate).toHaveBeenCalled();
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
        subject: null,
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
      mockStateSignal.update((s: SearchState) => ({ ...s, loading: true }));
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('span[style*="animation: spin"]'));
      expect(spinner).toBeTruthy();
    });

    it('dovrebbe mostrare il box di errore se presente un errore nello stato', () => {
      mockStateSignal.update((s: SearchState) => ({
        ...s,
        loading: false,
        error: { message: 'Errore di Rete', code: '500' } as any,
      }));
      fixture.detectChanges();

      const errorBox = fixture.nativeElement.querySelector('div[style*="color: #991b1b"]');
      expect(errorBox.textContent).toContain('Errore di Rete');

      const retryBtn = fixture.debugElement.query(By.css('button[style*="background: #ef4444"]'));
      retryBtn.triggerEventHandler('click', null);
      expect(mockFacade.retry).toHaveBeenCalled();
    });

    it('dovrebbe mostrare i risultati e il json se ci sono elementi trovati', () => {
      mockStateSignal.update((s: SearchState) => ({
        ...s,
        loading: false,
        error: null,
        results: [
         { documentId: 'DOC-123', name: 'Test', type: 'AGGREGAZIONE_DOCUMENTALE', score: null },
         { documentId: 'DOC-246', name: 'Test2', type: 'DOCUMENTO_INFORMATICO', score: null }
        ] as SearchResult[],
      }));
      fixture.detectChanges();

      const searchResultsElement = fixture.debugElement.query(By.css('app-search-results'));
      expect(searchResultsElement).toBeTruthy();

      const searchResultsInstance = searchResultsElement.componentInstance;
      expect(searchResultsInstance.results.length).toBe(2);
      expect(searchResultsInstance.results[0].name).toBe('Test');
      expect(searchResultsInstance.results[1].name).toBe('Test2');
       
    });

    it('dovrebbe mostrare il messaggio "Nessun risultato" se array vuoto e query testuale presente', () => {
      mockStateSignal.update((s: SearchState) => ({
        ...s,
        loading: false,
        error: null,
        results: [],
        query: { ...s.query, text: 'parola inesistente' },
      }));
      fixture.detectChanges();

      const noResultsDiv = fixture.debugElement.query(By.css('div[style*="text-align: center"]'));
      expect(noResultsDiv).toBeTruthy();
      expect(noResultsDiv.nativeElement.textContent).toContain('Nessun risultato trovato');
    });
  });
});
