import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcGateway } from './ipc-gateway';
import { IpcCacheService } from '../../../shared/services/ipc-cache.service';
import { IpcErrorHandlerService } from '../../../shared/services/ipc-error-handler.service';
import { ELECTRON_CONTEXT_BRIDGE_TOKEN } from '../../../shared/contracts';
import { DipTreeNode } from '../contracts/dip-tree-node';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { TestBed } from '@angular/core/testing';

describe('IpcGateway', () => {
  let gateway: IpcGateway;

  // mock dipendenze
  let mockBridge: any;
  let mockCache: any;
  let mockErrorHandler: any;

  beforeEach(() => {
    mockBridge = {
      invoke: vi.fn()
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn()
    };

    mockErrorHandler = {
      handle: vi.fn((err) => err)
    };

    TestBed.configureTestingModule({
      providers: [
        IpcGateway,
        { provide: ELECTRON_CONTEXT_BRIDGE_TOKEN, useValue: mockBridge },
        { provide: IpcCacheService, useValue: mockCache },
        { provide: IpcErrorHandlerService, useValue: mockErrorHandler },
      ]
    });

    gateway = TestBed.inject(IpcGateway);
  });

  // ─────────────────────────────────────────────
  // getChildren()
  // ─────────────────────────────────────────────

  it('getChildren → dip → chiama getDocumentClasses', async () => {
    mockCache.get.mockReturnValue(null);
    mockBridge.invoke.mockResolvedValue([]);

    const parent: DipTreeNode = { id: 1, name: '', type: 'dip', hasChildren: true };

    await gateway.getChildren(parent);

    expect(mockBridge.invoke).toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID,
      1
    );
  });

  it('getChildren → file → ritorna array vuoto', async () => {
    const parent: DipTreeNode = { id: 1, name: '', type: 'file', hasChildren: false };

    const result = await gateway.getChildren(parent);

    expect(result).toEqual([]);
  });

  // ─────────────────────────────────────────────
  // mapping DTO → DipTreeNode
  // ─────────────────────────────────────────────

  it('getDocumentClasses mappa correttamente i DTO', async () => {
    mockCache.get.mockReturnValue(null);

    mockBridge.invoke.mockResolvedValue([
      { id: 10, uuid: 'ABC' }
    ]);

    const parent: DipTreeNode = { id: 1, name: '', type: 'dip', hasChildren: true };

    const result = await gateway.getChildren(parent);

    expect(result).toEqual([
      {
        id: 10,
        name: 'ABC',
        type: 'documentClass',
        hasChildren: true,
      }
    ]);
  });

  it('getFiles mappa correttamente i DTO', async () => {
    mockCache.get.mockReturnValue(null);

    mockBridge.invoke.mockResolvedValue([
      { id: 5, filename: 'file.pdf' }
    ]);

    const parent: DipTreeNode = { id: 2, name: '', type: 'document', hasChildren: true };

    const result = await gateway.getChildren(parent);

    expect(result[0].type).toBe('file');
    expect(result[0].hasChildren).toBe(false);
  });

  // ─────────────────────────────────────────────
  // cache
  // ─────────────────────────────────────────────

  it('usa la cache se presente', async () => {
    const cached = [{ id: 1, name: 'cached', type: 'file', hasChildren: false }];
    mockCache.get.mockReturnValue(cached);

    const parent: DipTreeNode = { id: 1, name: '', type: 'document', hasChildren: true };

    const result = await gateway.getChildren(parent);

    expect(result).toBe(cached);
    expect(mockBridge.invoke).not.toHaveBeenCalled();
  });

  it('salva in cache dopo invoke', async () => {
    mockCache.get.mockReturnValue(null);
    mockBridge.invoke.mockResolvedValue([]);

    const parent: DipTreeNode = { id: 1, name: '', type: 'dip', hasChildren: true };

    await gateway.getChildren(parent);

    expect(mockCache.set).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // error handling
  // ─────────────────────────────────────────────

  it('gestisce errori tramite IpcErrorHandler', async () => {
    const error = new Error('IPC error');

    mockCache.get.mockReturnValue(null);
    mockBridge.invoke.mockRejectedValue(error);

    const parent: DipTreeNode = { id: 1, name: '', type: 'dip', hasChildren: true };

    await expect(gateway.getChildren(parent)).rejects.toThrow();

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(error);
  });
});