import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { IntegrityFacade } from './integrity.facade';
import { IntegrityIpcGateway } from '../infrastructure/integrity-ipc.gateway';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';
import {
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
  ICacheService,
  IErrorHandler,
} from '../../../shared/contracts';
import { AppError, ErrorCategory, ErrorCode, ErrorSeverity } from '../../../shared/domain';

describe('IntegrityFacade', () => {
  let facade: IntegrityFacade;

  let mockGateway: {
    checkDipIntegrity: Mock;
    getClassesByDipId: Mock;
    checkDocumentIntegrity: Mock;
    checkProcessIntegrity: Mock;
    checkDocumentClassIntegrity: Mock;
    getProcessesByClassId: Mock;
    getDocumentsByProcessId: Mock;
  };
  let mockCache: ICacheService & {
    get: Mock;
    set: Mock;
    invalidate: Mock;
    invalidatePrefix: Mock;
  };
  let mockErrorHandler: IErrorHandler & {
    handle: Mock;
    createError: Mock;
  };

  beforeEach(() => {
    mockGateway = {
      checkDipIntegrity: vi.fn(),
      getClassesByDipId: vi.fn(),
      checkDocumentIntegrity: vi.fn(),
      checkProcessIntegrity: vi.fn(),
      checkDocumentClassIntegrity: vi.fn(),
      getProcessesByClassId: vi.fn(),
      getDocumentsByProcessId: vi.fn(),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      invalidatePrefix: vi.fn(),
    };

    const mappedError: AppError = {
      code: ErrorCode.INTEGRITY_VERIFY_ERROR,
      message: 'errore test',
      source: 'test',
      category: ErrorCategory.DOMAIN,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
      context: null,
      detail: null,
    };

    mockErrorHandler = {
      handle: vi.fn().mockReturnValue(mappedError),
      createError: vi.fn().mockReturnValue(mappedError),
    };

    TestBed.configureTestingModule({
      providers: [
        IntegrityFacade,
        { provide: IntegrityIpcGateway, useValue: mockGateway },
        { provide: CACHE_SERVICE_TOKEN, useValue: mockCache },
        { provide: ERROR_HANDLER_TOKEN, useValue: mockErrorHandler },
      ],
    });

    facade = TestBed.inject(IntegrityFacade);
  });

  it('verifyDip invalida tutti i prefissi cache del dettaglio', async () => {
    mockGateway.checkDipIntegrity.mockResolvedValue(IntegrityStatusEnum.VALID);
    mockGateway.getClassesByDipId.mockResolvedValue([]);

    await facade.verifyDip(1);

    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('aggregate:');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('process:');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('document:');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('node-fallback:');
    expect(facade.currentDipStatus()()).toBe(IntegrityStatusEnum.VALID);
  });

  it('verifyItem DOCUMENT invalida la chiave documento specifica', async () => {
    mockGateway.checkDocumentIntegrity.mockResolvedValue(IntegrityStatusEnum.VALID);

    const result = await facade.verifyItem('12', 'DOCUMENT');

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(mockGateway.checkDocumentIntegrity).toHaveBeenCalledWith(12);
    expect(mockCache.invalidate).toHaveBeenCalledWith('document:12');
  });

  it('verifyItem PROCESS invalida process/aggregate e prefisso document', async () => {
    mockGateway.checkProcessIntegrity.mockResolvedValue(IntegrityStatusEnum.INVALID);

    const result = await facade.verifyItem('31', 'PROCESS');

    expect(result).toBe(IntegrityStatusEnum.INVALID);
    expect(mockGateway.checkProcessIntegrity).toHaveBeenCalledWith(31);
    expect(mockCache.invalidate).toHaveBeenCalledWith('process:31');
    expect(mockCache.invalidate).toHaveBeenCalledWith('aggregate:31');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('document:');
  });

  it('verifyItem DOCUMENT_CLASS invalida cache fallback e prefissi correlati', async () => {
    mockGateway.checkDocumentClassIntegrity.mockResolvedValue(IntegrityStatusEnum.UNKNOWN);

    const result = await facade.verifyItem('22', 'DOCUMENT_CLASS');

    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(mockGateway.checkDocumentClassIntegrity).toHaveBeenCalledWith(22);
    expect(mockCache.invalidate).toHaveBeenCalledWith('node-fallback:DOCUMENT_CLASS:22');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('process:');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('aggregate:');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('document:');
  });

  it('verifyItem AGGREGATE invalida aggregate/process e prefisso document', async () => {
    mockGateway.checkProcessIntegrity.mockResolvedValue(IntegrityStatusEnum.VALID);

    const result = await facade.verifyItem('44', 'AGGREGATE');

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(mockGateway.checkProcessIntegrity).toHaveBeenCalledWith(44);
    expect(mockCache.invalidate).toHaveBeenCalledWith('aggregate:44');
    expect(mockCache.invalidate).toHaveBeenCalledWith('process:44');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('document:');
  });

  it('verifyItem in errore ritorna UNKNOWN e aggiorna errore tramite handler', async () => {
    const rawError = new Error('boom');
    mockGateway.checkDocumentIntegrity.mockRejectedValue(rawError);

    const result = await facade.verifyItem('55', 'DOCUMENT');

    expect(result).toBe('UNKNOWN');
    expect(mockErrorHandler.handle).toHaveBeenCalledTimes(1);

    const handledError = mockErrorHandler.handle.mock.calls[0][0] as {
      source?: string;
      context?: { itemId: string; itemType: string; action: string };
    };

    expect(handledError.source).toBe('IntegrityFacade.verifyItem');
    expect(handledError.context).toEqual({
      itemId: '55',
      itemType: 'DOCUMENT',
      action: 'CHECK_ITEM_INTEGRITY',
    });
    expect(facade.error()()).toBe('errore test');
  });

  it('clearResults resetta stato, classi ed errore quando non sta verificando', async () => {
    mockGateway.checkDipIntegrity.mockResolvedValue(IntegrityStatusEnum.INVALID);
    mockGateway.getClassesByDipId.mockResolvedValue([{ id: 1, name: 'Classe A' }]);

    await facade.verifyDip(1);
    expect(facade.currentDipStatus()()).toBe(IntegrityStatusEnum.INVALID);
    expect(facade.dipClasses()()).toEqual([{ id: 1, name: 'Classe A' }]);

    facade.clearResults();

    expect(facade.currentDipStatus()()).toBeNull();
    expect(facade.dipClasses()()).toEqual([]);
    expect(facade.error()()).toBeNull();
  });

  it('clearResults non modifica i dati se verifica in corso', async () => {
    mockGateway.checkDipIntegrity.mockResolvedValue(IntegrityStatusEnum.VALID);
    mockGateway.getClassesByDipId.mockResolvedValue([{ id: 2, name: 'Classe B' }]);

    await facade.verifyDip(2);
    (facade as any)._isVerifying.set(true);

    facade.clearResults();

    expect(facade.currentDipStatus()()).toBe(IntegrityStatusEnum.VALID);
    expect(facade.dipClasses()()).toEqual([{ id: 2, name: 'Classe B' }]);

    (facade as any)._isVerifying.set(false);
  });
});
