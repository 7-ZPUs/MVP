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
    expect(facade.currentDipStatus()).toBe(IntegrityStatusEnum.VALID);
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
  it('dovrebbe ritornare anticipatamente se verifyDip è chiamato mentre isVerifying è true', async () => {
    // Forziamo lo stato a isVerifying = true tramite loadOverview finta
    mockGateway.getClassesByDipId.mockImplementation(() => new Promise(() => {})); // Never resolves
    facade.loadOverview(1);
    expect(facade.isVerifying()()).toBe(true);

    await facade.verifyDip(2);
    // Non dovrebbe chiamare checkDipIntegrity
    expect(mockGateway.checkDipIntegrity).not.toHaveBeenCalled();
  });

  it('dovrebbe gestire un errore in verifyDip e arricchirlo prima di mandarlo allErrorHandler', async () => {
    const rawError = new Error('Gateway Error');
    mockGateway.checkDipIntegrity.mockRejectedValue(rawError);

    await facade.verifyDip(1);

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'IntegrityFacade.verifyDip' })
    );
    expect(facade.error()()).toBe('errore test');
    expect(facade.isVerifying()()).toBe(false);
  });

  it('dovrebbe gestire un errore non-oggetto in verifyDip', async () => {
    mockGateway.checkDipIntegrity.mockRejectedValue('String Error');

    await facade.verifyDip(1);

    expect(mockErrorHandler.handle).toHaveBeenCalled();
    expect(facade.error()()).toBe('errore test');
  });

  it('verifyItem dovrebbe ritornare anticipatamente UNKNOWN se isVerifying è true', async () => {
    mockGateway.getClassesByDipId.mockImplementation(() => new Promise(() => {}));
    facade.loadOverview(1);

    const result = await facade.verifyItem('1', 'DOCUMENT');
    expect(result).toBe('UNKNOWN');
    expect(mockGateway.checkDocumentIntegrity).not.toHaveBeenCalled();
  });

  it('verifyItem AGGREGATE invalida process/aggregate e prefisso document in modo simile a PROCESS', async () => {
    mockGateway.checkProcessIntegrity.mockResolvedValue(IntegrityStatusEnum.VALID);
    
    const result = await facade.verifyItem('50', 'AGGREGATE');

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(mockGateway.checkProcessIntegrity).toHaveBeenCalledWith(50);
    expect(mockCache.invalidate).toHaveBeenCalledWith('aggregate:50');
    expect(mockCache.invalidate).toHaveBeenCalledWith('process:50');
    expect(mockCache.invalidatePrefix).toHaveBeenCalledWith('document:');
  });

  it('dovrebbe gestire un errore in verifyItem e arricchirlo', async () => {
    const rawError = new Error('Network error');
    mockGateway.checkDocumentIntegrity.mockRejectedValue(rawError);

    const result = await facade.verifyItem('1', 'DOCUMENT');

    expect(result).toBe('UNKNOWN');
    expect(mockErrorHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'IntegrityFacade.verifyItem' })
    );
    expect(facade.error()()).toBe('errore test');
  });

  it('dovrebbe gestire string error in verifyItem', async () => {
    mockGateway.checkDocumentIntegrity.mockRejectedValue('String Error');

    const result = await facade.verifyItem('1', 'DOCUMENT');

    expect(result).toBe('UNKNOWN');
    expect(mockErrorHandler.handle).toHaveBeenCalled();
    expect(facade.error()()).toBe('errore test');
  });

  it('clearResults dovrebbe pulire i risultati se isVerifying è false', async () => {
    // Imposta un finto stato
    mockGateway.checkDipIntegrity.mockResolvedValue(IntegrityStatusEnum.VALID);
    await facade.verifyDip(1);
    expect(facade.currentDipStatus()()).toBe(IntegrityStatusEnum.VALID);

    facade.clearResults();

    expect(facade.currentDipStatus()()).toBe(null);
    expect(facade.dipClasses()()).toEqual([]);
    expect(facade.error()()).toBeNull();
  });

  it('clearResults non dovrebbe pulire i risultati se isVerifying è true', async () => {
    mockGateway.getClassesByDipId.mockImplementation(() => new Promise(() => {}));
    facade.loadOverview(1); // Setta isVerifying a true
    
    // Questo era il workaround safe in test
    (facade as any)['_currentDipStatus'].set(IntegrityStatusEnum.VALID);
    
    facade.clearResults();

    // Rimanere inalterato
    expect(facade.currentDipStatus()()).toBe(IntegrityStatusEnum.VALID);
  });

  describe('loadOverview', () => {
    it('dovrebbe calcolare statistiche e nodi corretti per una classe valid', async () => {
      mockGateway.getClassesByDipId.mockResolvedValue([
        { id: 10, name: 'Class 10', integrityStatus: IntegrityStatusEnum.VALID }
      ]);
      mockGateway.getProcessesByClassId.mockResolvedValue([
        { id: 100, uuid: 'p-100', integrityStatus: IntegrityStatusEnum.VALID },
        { id: 101, uuid: 'p-101', integrityStatus: IntegrityStatusEnum.UNKNOWN }
      ]);

      await facade.loadOverview(1);

      expect(facade.overviewStats()()).toEqual({
        validProcesses: 1,
        invalidProcesses: 0,
        unverifiedProcesses: 1
      });
      const validNodes = facade.validRolledUpNodes()();
      expect(validNodes).toHaveLength(1);
      expect(validNodes[0]).toEqual({ id: 10, type: 'CLASS', name: 'Class 10', status: IntegrityStatusEnum.VALID });
      expect(facade.corruptedNodes()()).toHaveLength(0);
    });

    it('dovrebbe calcolare statistics and corrupted nodes for nested invalid docs', async () => {
      // Class => unknown
      mockGateway.getClassesByDipId.mockResolvedValue([
        { id: 20, name: 'Class 20', integrityStatus: IntegrityStatusEnum.UNKNOWN }
      ]);
      // Process => unknown & valid & invalid
      mockGateway.getProcessesByClassId.mockResolvedValue([
        { id: 200, uuid: 'p-200', integrityStatus: IntegrityStatusEnum.VALID },
        { id: 201, uuid: 'p-201', integrityStatus: IntegrityStatusEnum.UNKNOWN },
        { id: 202, uuid: 'p-202', integrityStatus: IntegrityStatusEnum.INVALID }
      ]);
      // Docs for p-200 not queried (because process is VALID and loop short-circuits)
      // Docs for p-201 query
      mockGateway.getDocumentsByProcessId.mockImplementation(async (pid) => {
        if (pid === 201) return [
          { id: 2010, uuid: 'd-2010', integrityStatus: IntegrityStatusEnum.VALID },
          { id: 2011, uuid: 'd-2011', integrityStatus: IntegrityStatusEnum.INVALID }
        ];
        if (pid === 202) return [];
        return [];
      });

      await facade.loadOverview(1);

      expect(facade.overviewStats()()).toEqual({
        validProcesses: 1,
        invalidProcesses: 1,
        unverifiedProcesses: 1
      });

      const validNodes = facade.validRolledUpNodes()();
      expect(validNodes).toContainEqual({
        id: 200, type: 'PROCESS', name: 'Processo p-200', status: IntegrityStatusEnum.VALID, contextPath: 'Class 20'
      });
      expect(validNodes).toContainEqual({
        id: 2010, type: 'DOCUMENT', name: 'Doc d-2010', status: IntegrityStatusEnum.VALID, contextPath: 'Class 20 > p-201'
      });
      // the class itself should also be marked invalid because hasInvalidDocument was true
      expect(validNodes).toContainEqual({
         id: 20, type: 'CLASS', name: 'Class 20', status: IntegrityStatusEnum.INVALID
      });

      const corruptedNodes = facade.corruptedNodes()();
      expect(corruptedNodes).toHaveLength(1);
      expect(corruptedNodes[0]).toEqual({
        id: 2011, type: 'DOCUMENT', name: 'Documento d-2011', status: IntegrityStatusEnum.INVALID, contextPath: 'Classe: Class 20 | Processo: p-201'
      });
    });

    it('dovrebbe gestire raw error come object null or string during loadOverview e arricchirlo per errore', async () => {
      mockGateway.getClassesByDipId.mockRejectedValue(null);

      await facade.loadOverview(1);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'IntegrityFacade.verifyDip' })
      );
      expect(facade.error()()).toBe('errore test');
    });
  });
});
