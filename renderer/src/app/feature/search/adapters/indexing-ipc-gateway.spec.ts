import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { IndexingIpcGateway } from './indexing-ipc-gateway';
import { SemanticIndexState } from '../domain/semantic-filter-models';
import { IndexingStatus } from '../domain/search.enum';
import { IErrorHandler, IElectronContextBridge } from '../../../shared/contracts';

describe('IndexingIpcGateway', () => {
  let gateway: IndexingIpcGateway;
  let mockBridge: IElectronContextBridge;
  let mockErrorHandler: IErrorHandler;

  beforeEach(() => {
    mockBridge = {
      invoke: vi.fn(),
    };

    mockErrorHandler = {
      handle: vi.fn().mockImplementation((err) => ({ message: err.message, code: 'TEST_ERR' })),
      createError: vi.fn(),
    };

    gateway = new IndexingIpcGateway(mockBridge, mockErrorHandler);
  });

  it('dovrebbe chiamare il canale IPC corretto per getIndexingStatus e restituire lo stato', async () => {
    const mockState: SemanticIndexState = {
      status: IndexingStatus.INDEXING,
      progressPercentage: 50,
      lastIndexedAt: null,
    };
    (mockBridge.invoke as Mock).mockResolvedValue(mockState);

    const result = await new Promise((resolve) => {
      gateway.getIndexingStatus().subscribe(resolve);
    });

    expect(mockBridge.invoke).toHaveBeenCalledWith('ipc:indexing:status', null);
    expect(result).toEqual(mockState);
  });

  it('dovrebbe chiamare il canale IPC corretto per cancel', async () => {
    (mockBridge.invoke as Mock).mockResolvedValue(undefined);

    await new Promise((resolve) => {
      gateway.cancel().subscribe(resolve);
    });

    expect(mockBridge.invoke).toHaveBeenCalledWith('ipc:indexing:cancel', null);
  });

  it('dovrebbe intercettare gli errori IPC e formattarli tramite IErrorHandler', async () => {
    const mockError = new Error('Processo di indicizzazione crashato');
    (mockBridge.invoke as Mock).mockRejectedValue(mockError);

    const errorResult = await new Promise((resolve) => {
      gateway.getIndexingStatus().subscribe({
        error: resolve,
      });
    });

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(mockError);
    expect((errorResult as any).message).toBe('Processo di indicizzazione crashato');
  });
});
