import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { NodeFallbackFacade } from './node-fallback.facade';
import { IPC_GATEWAY_TOKEN } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { AppError, ErrorCategory, ErrorCode, ErrorSeverity } from '../../../shared/domain';

describe('NodeFallbackFacade', () => {
  let facade: NodeFallbackFacade;

  let mockGateway: any;
  let mockCache: any;
  let mockTelemetry: any;
  let mockErrorHandler: any;

  beforeEach(() => {
    mockGateway = {
      invoke: vi.fn(),
      on: vi.fn(),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      invalidatePrefix: vi.fn(),
    };

    mockTelemetry = {
      trackEvent: vi.fn(),
      trackTiming: vi.fn(),
      trackError: vi.fn(),
    };

    mockErrorHandler = {
      handle: vi.fn(),
      createError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NodeFallbackFacade,
        { provide: IPC_GATEWAY_TOKEN, useValue: mockGateway },
        { provide: IpcCacheService, useValue: mockCache },
        { provide: TelemetryService, useValue: mockTelemetry },
        { provide: IpcErrorHandlerService, useValue: mockErrorHandler },
      ],
    });

    facade = TestBed.inject(NodeFallbackFacade);
  });

  it('usa la cache per dip senza chiamare gateway', async () => {
    const cached = {
      type: 'DIP',
      typeLabel: 'DIP',
      title: 'DIP',
      subtitle: 'Nodo radice del pacchetto documentale',
      fields: [{ label: 'UUID', value: 'dip-uuid' }],
    };
    (mockCache.get as Mock).mockReturnValue(cached);

    await facade.loadNode('DIP', '1');

    expect(mockCache.get).toHaveBeenCalledWith('node-fallback:DIP:1');
    expect(mockGateway.invoke).not.toHaveBeenCalled();
    expect(facade.getState()().detail).toEqual(cached);
  });

  it('carica e mappa document class via ipc by-id', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock)
      .mockResolvedValueOnce({
      id: 22,
      dipId: 1,
      uuid: 'DOC-CLASS-22',
      name: 'Classe Contratti',
      timestamp: '2026-04-07',
      integrityStatus: 'VALID',
      })
      .mockResolvedValueOnce([
        {
          id: 31,
          uuid: 'PROC-31',
          integrityStatus: 'UNKNOWN',
          metadata: [{ name: 'Oggetto', value: 'Processo Contratti', type: 'string' }],
        },
      ]);

    await facade.loadNode('DOCUMENT_CLASS', '22');

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID,
      22,
      null,
    );
    expect(mockGateway.invoke).toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
      22,
      null,
    );
    expect(facade.getState()().detail?.title).toBe('Classe Contratti');
    expect(facade.getState()().detail?.relatedSection?.items).toEqual([
      {
        itemType: 'PROCESS',
        itemId: '31',
        label: 'Processo Contratti',
        description: 'UUID: PROC-31 - Stato: UNKNOWN',
      },
    ]);
    expect(
      facade
        .getState()()
        .detail?.fields.some((field) => field.label.toLowerCase().includes('id interno')),
    ).toBe(false);
    expect(mockCache.set).toHaveBeenCalledWith(
      'node-fallback:DOCUMENT_CLASS:22',
      expect.any(Object),
      300000,
    );
  });

  it('normalizza il nome file nel fallback FILE', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockResolvedValue({
      id: 99,
      documentId: 12,
      filename: '/869e1069-e50d-48e6-8191-1c677f3053a2/Allegato_1.pdf',
      path: './x/y',
      hash: 'abc123',
      integrityStatus: 'VALID',
      isMain: false,
    });

    await facade.loadNode('FILE', '99');

    expect(facade.getState()().detail?.title).toBe('Allegato_1.pdf');
  });

  it('gestisce gli errori tramite error handler', async () => {
    const rawError = new Error('IPC broken');
    const mappedError: AppError = {
      code: ErrorCode.IPC_ERROR,
      message: 'IPC broken',
      source: 'Test',
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
      context: null,
      detail: null,
    };

    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockRejectedValue(rawError);
    (mockErrorHandler.handle as Mock).mockReturnValue(mappedError);

    await facade.loadNode('FILE', '99');

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
    expect(facade.getState()().error).toEqual(mappedError);
    expect(mockTelemetry.trackError).toHaveBeenCalledWith(mappedError);
  });
});