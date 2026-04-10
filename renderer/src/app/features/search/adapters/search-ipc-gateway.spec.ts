import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { SearchIpcGateway } from './search-ipc-gateway';
import { SearchQuery, SearchQueryType } from '../../../../../../shared/domain/metadata';
import { toSearchRequestDTO } from './search-request.mapper';
import {
  ICacheService,
  IErrorHandler,
  IElectronContextBridge,
  ERROR_HANDLER_TOKEN,
  CACHE_SERVICE_TOKEN,
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
} from '../../../shared/contracts';
import { TestBed } from '@angular/core/testing';

describe('SearchIpcGateway', () => {
  let gateway: SearchIpcGateway;
  let mockBridge: IElectronContextBridge;
  let mockCache: ICacheService;
  let mockErrorHandler: IErrorHandler;

  const mockQuery: SearchQuery = {
    text: 'test',
    type: SearchQueryType.FREE,
    useSemanticSearch: false,
  };
  const mockResults = [{ documentId: '1', name: 'Doc 1', type: 'PDF', score: 1 }];

  beforeEach(() => {
    mockBridge = {
      invoke: vi.fn(),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      invalidatePrefix: vi.fn(),
    };

    mockErrorHandler = {
      handle: vi.fn().mockImplementation((err) => ({ message: err.message, code: 'TEST_ERR' })),
      createError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SearchIpcGateway,
        { provide: ELECTRON_CONTEXT_BRIDGE_TOKEN, useValue: mockBridge },
        { provide: CACHE_SERVICE_TOKEN, useValue: mockCache },
        { provide: ERROR_HANDLER_TOKEN, useValue: mockErrorHandler },
      ],
    });

    gateway = TestBed.inject(SearchIpcGateway);
  });

  it('dovrebbe restituire i risultati dalla cache se disponibili (senza chiamare IPC)', () => {
    (mockCache.get as Mock).mockReturnValue(mockResults);

    const abortController = new AbortController();

    let result: any;
    gateway.search(mockQuery, abortController.signal).subscribe((res) => (result = res));

    expect(mockCache.get).toHaveBeenCalled();
    expect(mockBridge.invoke).not.toHaveBeenCalled();
    expect(result).toEqual(mockResults);
  });

  it('dovrebbe chiamare IPC e salvare in cache se il dato non è presente', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockBridge.invoke as Mock).mockResolvedValue(mockResults);

    const abortController = new AbortController();

    const result = await new Promise((resolve) => {
      gateway.search(mockQuery, abortController.signal).subscribe(resolve);
    });

    expect(mockBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:text',
      mockQuery,
      abortController.signal,
    );
    expect(mockCache.set).toHaveBeenCalled();
    expect(result).toEqual(mockResults);
  });

  it("dovrebbe invalidare la cache e lanciare errore tramite l'handler in caso di Abort", () => {
    (mockCache.get as Mock).mockReturnValue(null);

    (mockBridge.invoke as Mock).mockImplementation(() => new Promise(() => {}));

    const abortController = new AbortController();

    gateway.search(mockQuery, abortController.signal).subscribe({
      error: () => {},
    });

    abortController.abort();

    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('search:text');
    expect(mockErrorHandler.handle).not.toHaveBeenCalled();
  });

  it("dovrebbe formattare un errore di rete/IPC tramite l'IpcErrorHandlerService", async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    const mockError = new Error('IPC timeout');
    (mockBridge.invoke as Mock).mockRejectedValue(mockError);

    const abortController = new AbortController();

    const errorResult = await new Promise((resolve) => {
      gateway.search(mockQuery, abortController.signal).subscribe({
        error: resolve,
      });
    });

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(mockError);
    expect((errorResult as any).message).toBe('IPC timeout');
  });

  describe('searchAdvanced e searchSemantic', () => {
    const mockFilters: any = { common: { note: 'test' } };

    it('dovrebbe usare la cache e chiamare il canale corretto per searchAdvanced', async () => {
      (mockCache.get as Mock).mockReturnValue(null);
      (mockBridge.invoke as Mock).mockResolvedValue(mockResults);
      const abortController = new AbortController();

      const result = await new Promise((resolve) => {
        gateway.searchAdvanced(mockFilters, abortController.signal).subscribe(resolve);
      });

      const mapped = toSearchRequestDTO(mockFilters);

      expect(mockBridge.invoke).toHaveBeenCalledWith(
        'ipc:search:advanced',
        mapped,
        abortController.signal,
      );
      expect(result).toEqual(mockResults);

      (mockCache.get as Mock).mockReturnValue(mockResults);
      let cachedResult: any;
      gateway
        .searchAdvanced(mockFilters, abortController.signal)
        .subscribe((res) => (cachedResult = res));

      expect(mockCache.get).toHaveBeenCalledWith(`search:advanced:${JSON.stringify(mapped)}`);
      expect(cachedResult).toEqual(mockResults);
    });

    it('non deve invocare IPC per filtri avanzati non significativi', async () => {
      (mockCache.get as Mock).mockReturnValue(null);
      const abortController = new AbortController();

      const result = await new Promise((resolve) => {
        gateway.searchAdvanced({ common: {} } as any, abortController.signal).subscribe(resolve);
      });

      expect(mockBridge.invoke).not.toHaveBeenCalledWith(
        'ipc:search:advanced',
        expect.anything(),
        expect.anything(),
      );
      expect(result).toEqual([]);
    });

    it('dovrebbe usare la cache e chiamare il canale corretto per searchSemantic', async () => {
      (mockCache.get as Mock).mockReturnValue(null);
      (mockBridge.invoke as Mock).mockResolvedValue(mockResults);
      const abortController = new AbortController();

      const result = await new Promise((resolve) => {
        gateway.searchSemantic(mockQuery, abortController.signal).subscribe(resolve);
      });

      expect(mockBridge.invoke).toHaveBeenCalledWith(
        'ipc:search:semantic',
        mockQuery,
        abortController.signal,
      );
      expect(result).toEqual(mockResults);

      (mockCache.get as Mock).mockReturnValue(mockResults);
      let cachedResult: any;
      gateway
        .searchSemantic(mockQuery, abortController.signal)
        .subscribe((res) => (cachedResult = res));

      expect(mockCache.get).toHaveBeenCalledWith(`search:semantic:${JSON.stringify(mockQuery)}`);
      expect(cachedResult).toEqual(mockResults);
    });

    it('dovrebbe caricare le chiavi custom da IPC e cachearle', async () => {
      (mockCache.get as Mock).mockReturnValue(null);
      (mockBridge.invoke as Mock).mockResolvedValue(['NomeCliente', 'NumeroPratica']);
      const abortController = new AbortController();

      const result = await new Promise((resolve) => {
        gateway.getCustomMetadataKeys(1, abortController.signal).subscribe(resolve);
      });

      expect(mockBridge.invoke).toHaveBeenCalledWith(
        'search:get-custom-metadata-keys',
        1,
        abortController.signal,
      );
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toEqual(['NomeCliente', 'NumeroPratica']);
    });

    it('dovrebbe restituire le chiavi custom dalla cache senza chiamare IPC', () => {
      const cachedKeys = ['ChiaveA', 'ChiaveB'];
      (mockCache.get as Mock).mockReturnValue(cachedKeys);
      const abortController = new AbortController();

      let result: any;
      gateway.getCustomMetadataKeys(1, abortController.signal).subscribe((res) => (result = res));

      expect(mockCache.get).toHaveBeenCalledWith('search:custom-metadata-keys:1');
      expect(mockBridge.invoke).not.toHaveBeenCalledWith(
        'search:get-custom-metadata-keys',
        expect.anything(),
        expect.anything(),
      );
      expect(result).toEqual(cachedKeys);
    });
  });

  describe('Edge Cases del Segnale di Annullamento (AbortSignal)', () => {
    it('dovrebbe fallire immediatamente se il segnale è già stato annullato prima di iniziare', () => {
      (mockCache.get as Mock).mockReturnValue(null);
      const abortController = new AbortController();
      abortController.abort();

      let errorResult: any;
      gateway.search(mockQuery, abortController.signal).subscribe({
        error: (err) => (errorResult = err),
      });

      expect(mockBridge.invoke).not.toHaveBeenCalled();
      expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('search:text');
      expect(errorResult).toBeUndefined();
    });

    it('NON deve emettere risultati se la promise IPC si risolve in ritardo (dopo un abort)', async () => {
      (mockCache.get as Mock).mockReturnValue(null);

      let resolvePromise: any;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (mockBridge.invoke as Mock).mockReturnValue(pendingPromise);

      const abortController = new AbortController();

      let nextCalled = false;
      gateway.search(mockQuery, abortController.signal).subscribe({
        next: () => (nextCalled = true),
        error: () => {},
      });

      abortController.abort();
      resolvePromise(mockResults);
      await new Promise((r) => setTimeout(r, 0));

      expect(nextCalled).toBe(false);
    });

    it('NON deve propagare errori se la promise IPC fallisce in ritardo (dopo un abort)', async () => {
      (mockCache.get as Mock).mockReturnValue(null);

      let rejectPromise: any;
      const pendingPromise = new Promise((_, reject) => {
        rejectPromise = reject;
      });
      (mockBridge.invoke as Mock).mockReturnValue(pendingPromise);

      const abortController = new AbortController();

      let errorCount = 0;
      gateway.search(mockQuery, abortController.signal).subscribe({
        error: () => errorCount++,
      });
      abortController.abort();

      rejectPromise(new Error('Errore in ritardo'));

      await new Promise((r) => setTimeout(r, 0));
      expect(errorCount).toBe(0);
    });
  });
});
