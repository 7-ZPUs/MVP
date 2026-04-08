import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { ProcessFacade } from './process.facade';
import { IPC_GATEWAY_TOKEN } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { AppError, ErrorCategory, ErrorCode, ErrorSeverity } from '../../../shared/domain';
import { ProcessDetail } from '../domain/process.models';

describe('ProcessFacade', () => {
  let facade: ProcessFacade;

  let mockGateway: { invoke: Mock; on: Mock };
  let mockCache: {
    get: Mock;
    set: Mock;
    invalidate: Mock;
    invalidatePrefix: Mock;
  };
  let mockTelemetry: { trackEvent: Mock; trackTiming: Mock; trackError: Mock };
  let mockErrorHandler: { handle: Mock; createError: Mock };

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
        ProcessFacade,
        { provide: IPC_GATEWAY_TOKEN, useValue: mockGateway },
        { provide: IpcCacheService, useValue: mockCache },
        { provide: TelemetryService, useValue: mockTelemetry },
        { provide: IpcErrorHandlerService, useValue: mockErrorHandler },
      ],
    });

    facade = TestBed.inject(ProcessFacade);
  });

  it('usa la cache senza chiamare il gateway', async () => {
    const cachedDetail: ProcessDetail = {
      processId: '31',
      processUuid: 'PROC-31',
      integrityStatus: 'VALID',
      overview: { oggetto: 'P', procedimento: 'P', materiaArgomentoStruttura: 'P' },
      conservation: { processo: 'PROC-31', sessione: 'S1', dataInizio: '2026-01-01' },
      documentClass: { id: 22, name: 'Classe' },
      customMetadata: [],
      indiceDocumenti: [],
    };

    (mockCache.get as Mock).mockReturnValue(cachedDetail);

    await facade.loadProcess('31');

    expect(mockCache.get).toHaveBeenCalledWith('process:31');
    expect(mockGateway.invoke).not.toHaveBeenCalled();
    expect(facade.getState()().detail).toEqual(cachedDetail);
  });

  it('carica processo, classe e documenti e popola lo stato', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock)
      .mockResolvedValueOnce({
        id: 31,
        documentClassId: 22,
        uuid: 'PROC-31',
        integrityStatus: 'VALID',
        metadata: [],
      })
      .mockResolvedValueOnce([
        {
          id: 100,
          processId: 31,
          uuid: 'DOC-100',
          integrityStatus: 'VALID',
          metadata: [{ name: 'NomeDelDocumento', value: 'Contratto.pdf', type: 'string' }],
        },
      ])
      .mockResolvedValueOnce({
        id: 22,
        dipId: 1,
        uuid: 'CLASS-22',
        name: 'Classe Contratti',
        timestamp: '2026-04-08',
        integrityStatus: 'VALID',
      });

    await facade.loadProcess('31');

    expect(mockGateway.invoke).toHaveBeenCalledWith(IpcChannels.BROWSE_GET_PROCESS_BY_ID, 31, null);
    expect(mockGateway.invoke).toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
      31,
      null,
    );
    expect(mockGateway.invoke).toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID,
      22,
      null,
    );

    expect(facade.getState()().detail?.processUuid).toBe('PROC-31');
    expect(facade.getState()().detail?.documentClass.name).toBe('Classe Contratti');
    expect(facade.getState()().detail?.indiceDocumenti.length).toBe(1);
    expect(mockCache.set).toHaveBeenCalledWith('process:31', expect.any(Object), 300000);
  });

  it('espone errore applicativo quando la chiamata IPC fallisce', async () => {
    const rawError = new Error('IPC failure');
    const mappedError: AppError = {
      code: ErrorCode.IPC_ERROR,
      message: 'IPC failure',
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

    await facade.loadProcess('31');

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
    expect(facade.getState()().error).toEqual(mappedError);
    expect(mockTelemetry.trackError).toHaveBeenCalledWith(mappedError);
  });

  it('isProcess ritorna true quando trova il processo via IPC', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockResolvedValue({ id: 31 });

    const result = await facade.isProcess('31');

    expect(result).toBe(true);
    expect(mockGateway.invoke).toHaveBeenCalledWith(IpcChannels.BROWSE_GET_PROCESS_BY_ID, 31, null);
  });

  it('isProcess ritorna false con id non numerico', async () => {
    const result = await facade.isProcess('not-a-number');

    expect(result).toBe(false);
    expect(mockGateway.invoke).not.toHaveBeenCalled();
  });
});
