import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { of } from 'rxjs';
import { SearchIpcGateway } from './search-ipc-gateway';
import { SearchQuery, SearchQueryType } from '../domain';
import { ICacheService, IErrorHandler, IElectronContextBridge } from '../../../shared/contracts';

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

    gateway = new SearchIpcGateway(mockBridge, mockCache, mockErrorHandler);
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

    let errorResult: any;
    gateway.search(mockQuery, abortController.signal).subscribe({
      error: (err) => (errorResult = err),
    });

    abortController.abort();

    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('search:text');
    expect(mockErrorHandler.handle).toHaveBeenCalled();
    expect(errorResult.message).toBe('AbortError');
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
});
