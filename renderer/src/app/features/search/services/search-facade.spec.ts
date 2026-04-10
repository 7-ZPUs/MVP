import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SearchFacade } from './search-facade';
import { of, Subject, throwError, Observable } from 'rxjs';
import { SearchQueryType } from '../../../../../../shared/domain/metadata/search.enum';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SEARCH_CHANNEL_TOKEN } from '../contracts/search-channel.interface';
import { FILTER_VALIDATOR_TOKEN } from '../../validation/contracts/filter-validator.interface';
import { SEMANTIC_INDEX_STATUS_TOKEN } from '../contracts/semantic-index.interface';
import {
  ERROR_HANDLER_TOKEN,
  LIVE_ANNOUNCER_TOKEN,
  TELEMETRY_TOKEN,
} from '../../../shared/contracts';

// Helper nativo per attendere il completamento di RxJS e Promise senza usare fakeAsync
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SearchFacade', () => {
  let facade: SearchFacade;

  let mockSearchChannel: {
    search: ReturnType<typeof vi.fn>;
    searchAdvanced: ReturnType<typeof vi.fn>;
    searchSemantic: ReturnType<typeof vi.fn>;
    getCustomMetadataKeys: ReturnType<typeof vi.fn>;
  };
  let mockValidator: { validate: ReturnType<typeof vi.fn> };
  let mockErrorHandler: { handle: ReturnType<typeof vi.fn> };
  let mockTelemetry: {
    trackEvent: ReturnType<typeof vi.fn>;
    trackTiming: ReturnType<typeof vi.fn>;
    trackError: ReturnType<typeof vi.fn>;
  };
  let mockSemanticStatus: { getStatus: ReturnType<typeof vi.fn> };
  let mockLiveAnnouncer: { announce: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockSearchChannel = {
      search: vi.fn(),
      searchAdvanced: vi.fn(),
      searchSemantic: vi.fn(),
      getCustomMetadataKeys: vi.fn().mockReturnValue(of([])),
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
        { provide: SEARCH_CHANNEL_TOKEN, useValue: mockSearchChannel },
        { provide: FILTER_VALIDATOR_TOKEN, useValue: mockValidator },
        { provide: ERROR_HANDLER_TOKEN, useValue: mockErrorHandler },
        { provide: TELEMETRY_TOKEN, useValue: mockTelemetry },
        { provide: SEMANTIC_INDEX_STATUS_TOKEN, useValue: mockSemanticStatus },
        { provide: LIVE_ANNOUNCER_TOKEN, useValue: mockLiveAnnouncer },
      ],
    });

    facade = TestBed.inject(SearchFacade);
  });

  afterEach(() => {
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
      await sleep(350); // Attende il debounce di 300ms + margine

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
      await sleep(350);

      expect(mockSearchChannel.search).not.toHaveBeenCalled();
    });
  });

  describe('EC3: Validazione Filtri Avanzati', () => {
    it("searchAdvanced() NON deve chiamare l'IPC se la pre-validazione fallisce", async () => {
      const validationError = { field: 'dataDa', message: 'Formato errato', code: 'ERROR' };
      mockValidator.validate.mockReturnValue({
        isValid: false,
        errors: new Map([['dataDa', [validationError]]]),
      });
      const dummyFilters = { common: { note: 'test' } } as any;

      facade.searchAdvanced(dummyFilters);
      await sleep(0);

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
      await sleep(350);

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

      facade.searchSemantic({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: true });
      await sleep(0);

      expect(mockSearchChannel.searchSemantic).not.toHaveBeenCalled();
    });

    it("searchSemantic() deve eseguire se l'indicizzazione è READY", async () => {
      const mockResults = [{ id: '1', title: 'Result 1' }] as any;
      mockSemanticStatus.getStatus.mockReturnValue(
        signal({ status: 'READY', progress: 100, lastIndexedAt: Date.now() }),
      );
      mockSearchChannel.searchSemantic.mockReturnValue(of(mockResults));

      facade.searchSemantic({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: true });
      await sleep(0);

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
      await sleep(350);

      const state = facade.getState()();
      expect(state.results).toEqual(mockResults);
      expect(state.loading).toBe(false);
      expect(state.isSearching).toBe(false);
      expect(mockTelemetry.trackEvent).toHaveBeenCalledWith(expect.any(String));
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Trovati 2 risultati', 'polite');
    });

    it('searchAdvanced() deve popolare results dopo validazione positiva', async () => {
      const mockResults = [{ id: '1', title: 'Result 1' }] as any;
      const dummyFilters = { common: { note: 'test' } } as any;

      mockValidator.validate.mockReturnValue({ isValid: true, errors: new Map() });
      mockSearchChannel.searchAdvanced.mockReturnValue(of(mockResults));

      facade.searchAdvanced(dummyFilters);
      await sleep(0);

      const state = facade.getState()();
      expect(state.results).toEqual(mockResults);
      expect(state.validationErrors.size).toBe(0);
      expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledWith(
        dummyFilters,
        expect.any(AbortSignal),
      );
    });

    it('searchAdvanced() non deve chiamare IPC con filtri vuoti e deve svuotare i risultati', async () => {
      mockValidator.validate.mockReturnValue({ isValid: true, errors: new Map() });
      facade['state'].update((s: any) => ({ ...s, results: [{ id: 'old' }] }));

      facade.searchAdvanced({
        common: {},
        diDai: {},
        aggregate: {},
        customMeta: null,
        subject: [],
      } as any);
      await sleep(0);

      expect(mockSearchChannel.searchAdvanced).not.toHaveBeenCalled();
      expect(facade.getState()().results).toEqual([]);
      expect(facade.getState()().loading).toBe(false);
      expect(facade.getState()().isSearching).toBe(false);
    });
  });

  describe('AbortError handling', () => {
    it('search() deve ignorare AbortError e non tracciare il telemetry', async () => {
      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';
      mockSearchChannel.search.mockReturnValue(throwError(() => abortError));

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await sleep(350);

      expect(mockErrorHandler.handle).not.toHaveBeenCalled();
      expect(mockTelemetry.trackError).not.toHaveBeenCalled();
      expect(facade.getState()().loading).toBe(false);
    });
  });

  describe('setQuery e setFilters', () => {
    it('setQuery() deve aggiornare lo stato della query', () => {
      const newQuery = { text: 'new search', type: SearchQueryType.FREE, useSemanticSearch: true };
      facade.setQuery(newQuery);
      expect(facade.getState()().query).toEqual(newQuery);
    });

    it('setFilters() deve aggiornare lo stato dei filtri', () => {
      const newFilters = {
        common: { text: 'test' },
        diDai: {},
        aggregate: {},
        customMeta: null,
        subject: null,
      } as any;
      facade.setFilters(newFilters);
      expect(facade.getState()().filters).toEqual(newFilters);
    });
  });

  describe('retry()', () => {
    it('retry() deve triggerare una nuova ricerca', async () => {
      const mockResults = [{ id: '1', title: 'Result 1' }] as any;
      mockSearchChannel.search.mockReturnValue(of(mockResults));

      facade.setQuery({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.retry();
      await sleep(350);

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
      await sleep(150);
      expect(mockSearchChannel.search).not.toHaveBeenCalled();

      facade.search();
      await sleep(150);
      expect(mockSearchChannel.search).not.toHaveBeenCalled();

      await sleep(250);
      expect(mockSearchChannel.search).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validazione errors cleanup', () => {
    it('searchAdvanced() deve pulire gli errori di validazione precedenti su validazione positiva', async () => {
      const initialFilters = { common: {} } as any;

      facade['state'].update((s: any) => ({
        ...s,
        validationErrors: new Map([['test', { field: 'test', message: 'err', code: '1' }]]),
      }));

      mockValidator.validate.mockReturnValue({ isValid: true, errors: new Map() });
      mockSearchChannel.searchAdvanced.mockReturnValue(of([]));

      facade.searchAdvanced(initialFilters);
      await sleep(0);

      expect(facade.getState()().validationErrors.size).toBe(0);
    });
  });

  describe('Concurrent search prevention', () => {
    it('executeFullTextSearch() non deve eseguire se isSearching è già true', async () => {
      const pendingRequest = new Subject<any>();
      mockSearchChannel.search.mockReturnValue(pendingRequest.asObservable());

      facade.setQuery({ text: 'test1', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await sleep(350);

      expect(mockSearchChannel.search).toHaveBeenCalledTimes(1);
      expect(facade.getState()().isSearching).toBe(true);

      facade.setQuery({ text: 'test2', type: SearchQueryType.FREE, useSemanticSearch: false });
      facade.search();
      await sleep(350);

      expect(mockSearchChannel.search).toHaveBeenCalledTimes(1);

      pendingRequest.complete();
    });
  });

  describe('Guardie di concorrenza (Mutex) e Coverage', () => {
    beforeEach(() => {
      mockValidator.validate.mockReturnValue({ isValid: true, errors: new Map() });
    });

    it("dovrebbe bloccare executeAdvancedSearch se un'altra ricerca è in corso", () => {
      let resolveFirstSearch: any;
      mockSearchChannel.searchAdvanced.mockReturnValue(
        new Observable((subscriber) => {
          resolveFirstSearch = () => {
            subscriber.next([]);
            subscriber.complete();
          };
        }),
      );

      facade.searchAdvanced({ common: { note: 'test' } } as any);
      expect(facade.getState()().isSearching).toBe(true);

      facade.searchAdvanced({ common: { note: 'test' } } as any);
      expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledTimes(1);

      resolveFirstSearch();
    });

    it("dovrebbe bloccare executeSemanticSearch se un'altra ricerca è in corso", () => {
      mockSemanticStatus.getStatus.mockReturnValue(signal({ status: 'READY' }));

      let resolveSemantic: any;
      mockSearchChannel.searchSemantic.mockReturnValue(
        new Observable((subscriber) => {
          resolveSemantic = () => {
            subscriber.next([]);
            subscriber.complete();
          };
        }),
      );

      facade.searchSemantic({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: true });
      expect(facade.getState()().isSearching).toBe(true);

      facade.searchSemantic({ text: 'test2', type: SearchQueryType.FREE, useSemanticSearch: true });
      expect(mockSearchChannel.searchSemantic).toHaveBeenCalledTimes(1);

      resolveSemantic();
    });

    it('dovrebbe bloccare executeFullTextSearch se il mutex si attiva durante il debounce', async () => {
      facade.search();

      let resolveAdvanced: any;
      mockSearchChannel.searchAdvanced.mockReturnValue(
        new Observable((subscriber) => {
          resolveAdvanced = () => {
            subscriber.next([]);
            subscriber.complete();
          };
        }),
      );
      facade.searchAdvanced({ common: { note: 'test' } } as any);

      await sleep(350);
      expect(mockSearchChannel.search).not.toHaveBeenCalled();

      resolveAdvanced();
    });
  });

  describe('Copertura Rami (Branch Coverage)', () => {
    it('cancelSearch() non deve fallire o lanciare eccezioni se abortController è null', () => {
      facade['abortController'] = null;
      expect(() => facade.cancelSearch()).not.toThrow();
      expect(facade.getState()().isSearching).toBe(false);
    });

    it('prepareForSearch() deve abortire un vecchio controller se ancora presente', async () => {
      const mockController = new AbortController();
      const abortSpy = vi.spyOn(mockController, 'abort');
      facade['abortController'] = mockController;

      mockSearchChannel.search.mockReturnValue(of([]));

      facade.search();
      await sleep(350);

      expect(abortSpy).toHaveBeenCalled();
    });

    it('executeAdvancedSearch() deve gestire correttamente gli errori nel blocco catch', async () => {
      mockValidator.validate.mockReturnValue({ isValid: true, errors: new Map() });
      const rawError = new Error('Timeout avanzato');

      mockSearchChannel.searchAdvanced.mockReturnValue(throwError(() => rawError));
      mockErrorHandler.handle.mockReturnValue({ code: 'ERR_ADV', message: 'Errore' });

      facade.searchAdvanced({ common: { note: 'test' } } as any);
      await sleep(0);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
      expect(facade.getState()().error).toEqual({ code: 'ERR_ADV', message: 'Errore' });
    });

    it('executeSemanticSearch() deve gestire correttamente gli errori nel blocco catch', async () => {
      mockSemanticStatus.getStatus.mockReturnValue(signal({ status: 'READY' }));
      const rawError = new Error('Timeout semantico');

      mockSearchChannel.searchSemantic.mockReturnValue(throwError(() => rawError));
      mockErrorHandler.handle.mockReturnValue({ code: 'ERR_SEM', message: 'Errore' });

      facade.searchSemantic({ text: 'test', type: SearchQueryType.FREE, useSemanticSearch: true });
      await sleep(0);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
      expect(facade.getState()().error).toEqual({ code: 'ERR_SEM', message: 'Errore' });
    });

    it('handleError() deve processare correttamente un errore nullo o senza proprietà name', async () => {
      mockSearchChannel.search.mockReturnValue(throwError(() => null));
      mockErrorHandler.handle.mockReturnValue({ code: 'UNKNOWN' });

      facade.search();
      await sleep(350);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(null);
    });
  });
});
