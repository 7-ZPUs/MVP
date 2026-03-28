import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AggregateFacade } from './aggregate.facade';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
// Supponiamo che il token del gateway esista
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { ErrorCode, ErrorCategory, ErrorSeverity, AppError } from '../../../shared/domain';
import { AggregateDetail } from '../domain/aggregate.models';

describe('AggregateFacade', () => {
  // (o 'DocumentFacade')
  let facade: AggregateFacade; // (o DocumentFacade)

  // Usiamo 'any' (o un casting) per zittire TypeScript.
  // Nei test è una pratica comune per i mock, poiché a noi interessa
  // solo simulare le funzioni specifiche che il Facade andrà a chiamare, non l'intera classe.
  let mockGateway: any;
  let mockCache: any;
  let mockTelemetry: any;
  let mockErrorHandler: any;

  const mockAggregateData: AggregateDetail = {
    aggregateId: '123',
    metadata: {
      tipo: 'Fascicolo',
      id: '123',
      tipologiaFascicolo: 'Affari Generali',
      assegnazione: 'Ufficio Protocollo',
      dateApertura: '2023-01-01',
      progressivo: '001/2023',
      posizioneFisica: 'Archivio Centrale',
      idPrimaria: 'AGG-000',
      conservazione: '10 anni',
    },
    // adminProcedure è opzionale, possiamo ometterlo nel test base
    documentIndex: [{ tipo: 'DAI', identificativo: 'DOC-999' }],
  };

  beforeEach(() => {
    // Inizializziamo i mock con le spie (vi.fn()) di Vitest
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
        AggregateFacade, // <-- Ricordati di cambiare in DocumentFacade nell'altro file

        // Forniamo i nostri mock al posto dei servizi reali
        { provide: IPC_GATEWAY_TOKEN, useValue: mockGateway },
        { provide: IpcCacheService, useValue: mockCache },
        { provide: TelemetryService, useValue: mockTelemetry },
        { provide: IpcErrorHandlerService, useValue: mockErrorHandler },
      ],
    });

    facade = TestBed.inject(AggregateFacade); // <-- Cambia in DocumentFacade nell'altro file
  });

  it('dovrebbe restituire i dati dalla cache senza chiamare il gateway (Cache Hit)', async () => {
    // Arrange
    (mockCache.get as Mock).mockReturnValue(mockAggregateData);

    // Act
    await facade.loadAggregate('123');

    // Assert
    expect(mockCache.get).toHaveBeenCalledWith('aggregate:123');
    expect(mockGateway.invoke).not.toHaveBeenCalled(); // Il gateway non deve essere disturbato!
    expect(facade.getState()().detail).toEqual(mockAggregateData);
    expect(mockTelemetry.trackTiming).toHaveBeenCalled(); // Tracciamo comunque il tempo di risposta
  });

  it('dovrebbe chiamare il gateway e salvare in cache se i dati non sono presenti (Cache Miss)', async () => {
    // Arrange
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockResolvedValue(mockAggregateData);

    // Act
    await facade.loadAggregate('123');

    // Assert
    expect(mockGateway.invoke).toHaveBeenCalledWith('ipc:aggregate:get', '123', null);
    expect(mockCache.set).toHaveBeenCalledWith('aggregate:123', mockAggregateData, 300000); // 5 min = 300000 ms
    expect(facade.getState()().detail).toEqual(mockAggregateData);
  });

  it('dovrebbe gestire gli errori, mapparli tramite ErrorHandler e tracciarli con Telemetry', async () => {
    // Arrange
    const rawError = new Error('IPC disconnesso');
    const mappedError: AppError = {
      code: ErrorCode.IPC_ERROR,
      message: 'IPC disconnesso',
      source: 'Gateway',
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.FATAL,
      recoverable: false,
      context: null,
      detail: null,
    };

    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockRejectedValue(rawError);
    (mockErrorHandler.handle as Mock).mockReturnValue(mappedError);

    // Act
    await facade.loadAggregate('123');

    // Assert
    expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
    expect(facade.getState()().error).toEqual(mappedError);
    expect(mockTelemetry.trackError).toHaveBeenCalledWith(mappedError);
  });
});
