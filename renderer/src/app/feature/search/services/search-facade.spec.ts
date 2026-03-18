import { signal } from '@angular/core';
import { SearchFacade } from './search-facade';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { SearchQueryType } from '../domain/search.enum';

describe('SearchFacade', () => {
  let facade: SearchFacade;

  let mockSearchChannel: any;
  let mockValidator: any;
  let mockErrorHandler: any;
  let mockTelemetry: any;
  let mockSemanticStatus: any;
  let mockLiveAnnouncer: any;

  beforeEach(() => {
    mockSearchChannel = {
      search: vi.fn(),
      searchAdvanced: vi.fn(),
      searchSemantic: vi.fn(),
    };
    mockValidator = { validate: vi.fn() };
    mockErrorHandler = { handle: vi.fn() };
    mockTelemetry = { trackEvent: vi.fn(), trackTiming: vi.fn(), trackError: vi.fn() };

    const dummySemanticState = { status: 'idle', progress: 0, lastIndexedAt: null };
    mockSemanticStatus = { getStatus: vi.fn().mockReturnValue(signal(dummySemanticState)) };

    mockLiveAnnouncer = { announce: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SearchFacade,
        { provide: 'ISearchChannel', useValue: mockSearchChannel },
        { provide: 'IFilterValidator', useValue: mockValidator },
        { provide: 'IErrorHandler', useValue: mockErrorHandler },
        { provide: 'ITelemetry', useValue: mockTelemetry },
        { provide: 'ISemanticIndexStatus', useValue: mockSemanticStatus },
        { provide: 'ILiveAnnouncer', useValue: mockLiveAnnouncer },
      ],
    });

    facade = TestBed.inject(SearchFacade);
  });

  describe('EC1: Errore IPC', () => {
    it('search deve gestire gli errori. tracciarli e resettare isSearching', fakeAsync(() => {
      const rawError = new Error('Motore di ricerca non raggiungibile');
      mockSearchChannel.searchc.mockReturnValue(throwError(() => rawError));

      const appError = { code: 'SEARCH_ENGINE_ERROR', message: 'Offline', recoverable: true };
      mockErrorHandler.handle.mockReturnValue(appError);

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });

      facade.search();
      tick(300);

      const state = facade.getState()();
      expect(state.error).toEqual(appError);
      expect(state.loading).toBe(false);
      expect(state.isSearching).toBe(false);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
      expect(mockTelemetry.trackError).toHaveBeenCalledWith(appError);
    }));
  });

  describe('EC2: Concorrenza', () => {
    it('search() deve ignorare le chiamate se isSearching è già true', fakeAsync(() => {
      facade['state'].update((s: any) => ({ ...s, isSearching: true }));

      facade.search();
      tick(300);

      expect(mockSearchChannel.search).not.toHaveBeenCalled();
    }));
  });

  describe('EC3: Validazione Filtri Avanzati', () => {
    it("searchAdvanced() NON deve chiamare l'IPC se la pre-validazione fallisce", () => {
      const validationError = { field: 'dataDa', message: 'Formato errato', code: 'ERROR' };
      mockValidator.validate.mockReturnValue({
        isValid: false,
        errors: new Map([['dataDa', validationError]]),
      });
      const dummyFilters = {};

      facade.searchAdvanced(dummyFilters as any);

      const state = facade.getState()();
      expect(state.validationErrors.get('dataDa')).toEqual(validationError);
      expect(mockSearchChannel.searchAdvanced).not.toHaveBeenCalled();
    });
  });

  describe('EC4: Annullamento', () => {
    it('cancelSearch() deve ersettare i flag di caricamento e chiamare abort()', () => {
      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();

      facade.cancelSearch();

      const state = facade.getState()();
      expect(state.loading).toBe(false);
      expect(state.isSearching).toBe(false);
    });
  });

  describe('EC5: Ricerca Semantica', () => {
    it("searchSemantic() non deve eseguire se l'indicizzazione non è READY", fakeAsync(() => {
      mockSemanticStatus.getStatus.mockReturnValue(signal({ status: 'INDEXING' }));
      const localFacade = TestBed.inject(SearchFacade) as SearchFacade;

      localFacade.searchSemantic({
        text: 'test',
        type: SearchQueryType.FREE,
        useSemanticSearch: true,
      });
      tick(300);

      expect(mockSearchChannel.searchSemantic).not.toHaveBeenCalled();
    }));
  });
});
