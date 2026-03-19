import { signal } from '@angular/core';
import { SearchFacade } from './search-facade';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
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
    // Enable Vitest's native fake timers to handle RxJS debounceTime
    vi.useFakeTimers();

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
        { provide: 'ITelemetryService', useValue: mockTelemetry },
        { provide: 'ISemanticIndexStatus', useValue: mockSemanticStatus },
        { provide: 'ILiveAnnouncer', useValue: mockLiveAnnouncer },
      ],
    });

    facade = TestBed.inject(SearchFacade);
  });

  afterEach(() => {
    // Restore normal timing and clear mocks after each test
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('EC1: Errore IPC', () => {
    it('search deve gestire gli errori, tracciarli e resettare isSearching', async () => {
      const rawError = new Error('Motore di ricerca non raggiungibile');
      mockSearchChannel.search.mockReturnValue(throwError(() => rawError));

      const appError = { code: 'SEARCH_ENGINE_ERROR', message: 'Offline', recoverable: true };
      mockErrorHandler.handle.mockReturnValue(appError);

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });

      facade.search();
      await vi.advanceTimersByTimeAsync(300); // Wait for debounce and flush microtasks

      const state = facade.getState()();
      expect(state.error).toEqual(appError);
      expect(state.loading).toBe(false);
      expect(state.isSearching).toBe(false);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
      expect(mockTelemetry.trackError).toHaveBeenCalledWith(appError);
    });
  });

  describe('EC2: Concorrenza', () => {
    it('search() deve ignorare le chiamate se isSearching è già true', async () => {
      facade['state'].update((s: any) => ({ ...s, isSearching: true }));

      facade.search();
      await vi.advanceTimersByTimeAsync(300);

      expect(mockSearchChannel.search).not.toHaveBeenCalled();
    });
  });

  describe('EC3: Validazione Filtri Avanzati', () => {
    it("searchAdvanced() NON deve chiamare l'IPC se la pre-validazione fallisce", () => {
      const validationError = { field: 'dataDa', message: 'Formato errato', code: 'ERROR' };
      mockValidator.validate.mockReturnValue({
        isValid: false,
        errors: new Map([['dataDa', [validationError]]]),
      });
      const dummyFilters = { common: { text: 'test' } } as any;

      facade.searchAdvanced(dummyFilters);

      const state = facade.getState()();
      expect(state.validationErrors.get('dataDa')).toEqual(validationError);
      expect(mockSearchChannel.searchAdvanced).not.toHaveBeenCalled();
    });
  });

  describe('EC4: Annullamento', () => {
    it('cancelSearch() deve resettare i flag e triggerare AbortController', async () => {
      const pendingRequest = new Subject<any>();
      mockSearchChannel.search.mockReturnValue(pendingRequest.asObservable());

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await vi.advanceTimersByTimeAsync(300);

      const currentAbortController = facade['abortController'];
      const abortSpy = vi.spyOn(currentAbortController!, 'abort');

      facade.cancelSearch();

      const state = facade.getState()();
      expect(state.loading).toBe(false);
      expect(state.isSearching).toBe(false);
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('EC5: Ricerca Semantica', () => {
    it("searchSemantic() non deve eseguire se l'indicizzazione non è READY", async () => {
      mockSemanticStatus.getStatus.mockReturnValue(
        signal({ status: 'INDEXING', progress: 0, lastIndexedAt: null }),
      );

      facade.searchSemantic({
        text: 'test',
        type: SearchQueryType.FREE,
        useSemanticSearch: true,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockSearchChannel.searchSemantic).not.toHaveBeenCalled();
    });

    it("searchSemantic() deve eseguire se l'indicizzazione è READY", async () => {
      const mockResults = [{ id: '1', title: 'Result 1' }] as any;
      mockSemanticStatus.getStatus.mockReturnValue(
        signal({ status: 'READY', progress: 100, lastIndexedAt: Date.now() }),
      );
      mockSearchChannel.searchSemantic.mockReturnValue(of(mockResults));

      facade.searchSemantic({
        text: 'test',
        type: SearchQueryType.FREE,
        useSemanticSearch: true,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockSearchChannel.searchSemantic).toHaveBeenCalled();
      expect(facade.getState()().results).toEqual(mockResults);
    });
  });

  describe('Successo della ricerca', () => {
    it('search() deve popolare results e annunciare il numero di risultati', async () => {
      const mockResults = [
        { id: '1', title: 'Result 1' },
        { id: '2', title: 'Result 2' },
      ] as any;
      mockSearchChannel.search.mockReturnValue(of(mockResults));

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await vi.advanceTimersByTimeAsync(300);

      const state = facade.getState()();
      expect(state.results).toEqual(mockResults);
      expect(state.loading).toBe(false);
      expect(state.isSearching).toBe(false);
      expect(mockTelemetry.trackEvent).toHaveBeenCalledWith(expect.any(String));
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Trovati 2 risultati', 'polite');
    });

    it('searchAdvanced() deve popolare results dopo validazione positiva', async () => {
      const mockResults = [{ id: '1', title: 'Result 1' }] as any;
      const dummyFilters = { common: { text: 'test' } } as any;

      mockValidator.validate.mockReturnValue({
        isValid: true,
        errors: new Map(),
      });
      mockSearchChannel.searchAdvanced.mockReturnValue(of(mockResults));

      facade.searchAdvanced(dummyFilters);
      await vi.advanceTimersByTimeAsync(0);

      const state = facade.getState()();
      expect(state.results).toEqual(mockResults);
      expect(state.validationErrors.size).toBe(0);
      expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledWith(
        dummyFilters,
        expect.any(AbortSignal),
      );
    });
  });

  describe('AbortError handling', () => {
    it('search() deve ignorare AbortError e non tracciare il telemetry', async () => {
      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';
      mockSearchChannel.search.mockReturnValue(throwError(() => abortError));

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await vi.advanceTimersByTimeAsync(300);

      expect(mockErrorHandler.handle).not.toHaveBeenCalled();
      expect(mockTelemetry.trackError).not.toHaveBeenCalled();
      expect(facade.getState()().loading).toBe(false);
    });
  });

  describe('setQuery e setFilters', () => {
    it('setQuery() deve aggiornare lo stato della query', () => {
      const newQuery = { text: 'new search', type: SearchQueryType.FREE, useSemanticSearch: true };

      facade.setQuery(newQuery);

      const state = facade.getState()();
      expect(state.query).toEqual(newQuery);
    });

    it('setFilters() deve aggiornare lo stato dei filtri', () => {
      const newFilters = {
        common: { text: 'test' },
        diDai: {},
        aggregate: {},
        custom: [],
        subject: null,
      } as any;

      facade.setFilters(newFilters);

      const state = facade.getState()();
      expect(state.filters).toEqual(newFilters);
    });
  });

  describe('retry()', () => {
    it('retry() deve triggerare una nuova ricerca', async () => {
      const mockResults = [{ id: '1', title: 'Result 1' }] as any;
      mockSearchChannel.search.mockReturnValue(of(mockResults));

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.retry();
      await vi.advanceTimersByTimeAsync(300);

      expect(mockSearchChannel.search).toHaveBeenCalled();
      expect(facade.getState()().results).toEqual(mockResults);
    });
  });

  describe('Debounce behavior', () => {
    it('search() deve debounce le chiamate IPC di 300ms', async () => {
      const mockResults = [] as any;
      mockSearchChannel.search.mockReturnValue(of(mockResults));

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });

      facade.search();
      await vi.advanceTimersByTimeAsync(100);
      expect(mockSearchChannel.search).not.toHaveBeenCalled();

      facade.search(); // This resets the debounce timer
      await vi.advanceTimersByTimeAsync(100);
      expect(mockSearchChannel.search).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(200); // Complete the 300ms from the second call
      expect(mockSearchChannel.search).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validazione errors cleanup', () => {
    it('searchAdvanced() deve pulire gli errori di validazione precedenti su validazione positiva', async () => {
      const initialFilters = { common: {} } as any;

      facade['state'].update((s) => ({
        ...s,
        validationErrors: new Map([['test', { field: 'test', message: 'err', code: '1' }]]),
      }));

      mockValidator.validate.mockReturnValue({
        isValid: true,
        errors: new Map(),
      });
      mockSearchChannel.searchAdvanced.mockReturnValue(of([]));

      facade.searchAdvanced(initialFilters);
      await vi.advanceTimersByTimeAsync(0);

      const state = facade.getState()();
      expect(state.validationErrors.size).toBe(0);
    });
  });

  describe('Concurrent search prevention', () => {
    it('executeFullTextSearch() non deve eseguire se isSearching è già true', async () => {
      const pendingRequest = new Subject<any>();
      mockSearchChannel.search.mockReturnValue(pendingRequest.asObservable());

      facade.setQuery({ text: 'test1', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await vi.advanceTimersByTimeAsync(300);

      expect(mockSearchChannel.search).toHaveBeenCalledTimes(1);
      expect(facade.getState()().isSearching).toBe(true);

      facade.setQuery({ text: 'test2', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await vi.advanceTimersByTimeAsync(300);

      expect(mockSearchChannel.search).toHaveBeenCalledTimes(1);

      pendingRequest.complete();
    });
  });
});
