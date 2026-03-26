import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { of, throwError } from 'rxjs';
import { TelemetryService } from './telemetry.service';
import { ILoggingChannel, LOGGING_CHANNEL_TOKEN } from '../contracts/index';
import {
  AppError,
  TelemetryEvent,
  TelemetryMetric,
  LogLevel,
  ErrorCategory,
  ErrorSeverity,
  ErrorCode,
} from '../../shared/domain';
import { TestBed } from '@angular/core/testing';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let mockLoggingChannel: ILoggingChannel;

  const MOCK_TIME = 1620000000000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TIME);

    mockLoggingChannel = {
      writeLog: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        TelemetryService,
        { provide: LOGGING_CHANNEL_TOKEN, useValue: mockLoggingChannel },
      ],
    });

    service = TestBed.inject(TelemetryService);

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('trackEvent() dovrebbe inviare un log di livello INFO senza payload', () => {
    service.trackEvent(TelemetryEvent.SEARCH_EXECUTED);

    expect(mockLoggingChannel.writeLog).toHaveBeenCalledWith({
      level: LogLevel.INFO,
      event: TelemetryEvent.SEARCH_EXECUTED,
      timestamp: MOCK_TIME,
      payload: null,
    });
  });

  it('trackTiming() dovrebbe inviare un log di livello INFO con la durata nel payload', () => {
    service.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, 350);

    expect(mockLoggingChannel.writeLog).toHaveBeenCalledWith({
      level: LogLevel.INFO,
      event: TelemetryMetric.SEARCH_LATENCY_MS,
      timestamp: MOCK_TIME,
      payload: { durationMs: 350 },
    });
  });

  it("trackError() dovrebbe inviare un log di livello ERROR con l'oggetto AppError", () => {
    const mockError: AppError = {
      code: ErrorCode.IPC_ERROR,
      message: 'Disconnesso',
      source: 'Gateway',
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.FATAL,
      recoverable: false,
      context: null,
      detail: null,
    };

    service.trackError(mockError);

    expect(mockLoggingChannel.writeLog).toHaveBeenCalledWith({
      level: LogLevel.ERROR,
      event: 'APP_ERROR',
      timestamp: MOCK_TIME,
      payload: mockError,
    });
  });

  it('dovrebbe gestire in modo sicuro gli errori del canale di logging (fire-and-forget)', () => {
    // Simuliamo un errore dal canale IPC (es. disco pieno)
    const logError = new Error('Scrittura fallita');
    (mockLoggingChannel.writeLog as Mock).mockReturnValue(throwError(() => logError));

    // L'esecuzione non deve lanciare eccezioni che romperebbero l'applicazione
    expect(() => service.trackEvent(TelemetryEvent.SEARCH_EXECUTED)).not.toThrow();

    // Verifichiamo che il fallback difensivo in console sia stato richiamato
    expect(console.error).toHaveBeenCalledWith(
      'Fallimento scrittura telemetria via IPC:',
      logError,
    );
  });
});
