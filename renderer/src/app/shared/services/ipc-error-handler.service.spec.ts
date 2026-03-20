import { describe, it, expect, beforeEach } from 'vitest';
import { IpcErrorHandlerService } from './ipc-error-handler.service';
import { ErrorCode, ErrorCategory, ErrorSeverity } from '../domain';

describe('IpcErrorHandlerService', () => {
  let service: IpcErrorHandlerService;

  beforeEach(() => {
    service = new IpcErrorHandlerService();
  });

  describe('createError()', () => {
    it('dovrebbe creare un AppError con la corretta mappatura (es. DOC_BLOB_LOAD_ERROR)', () => {
      const error = service.createError(
        ErrorCode.DOC_BLOB_LOAD_ERROR,
        'File non trovato',
        'DocFacade',
      );

      expect(error.code).toBe(ErrorCode.DOC_BLOB_LOAD_ERROR);
      expect(error.message).toBe('File non trovato');
      expect(error.source).toBe('DocFacade');
      expect(error.category).toBe(ErrorCategory.IO);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.recoverable).toBe(true);
    });

    it('dovrebbe creare un AppError fatale e non recuperabile per IPC_ERROR', () => {
      const error = service.createError(ErrorCode.IPC_ERROR, 'Canale disconnesso', 'System');

      expect(error.severity).toBe(ErrorSeverity.FATAL);
      expect(error.recoverable).toBe(false);
    });
  });

  describe('handle() / toErrorCode()', () => {
    it("dovrebbe estrarre correttamente il codice se fornito nell'oggetto raw", () => {
      const rawError = {
        code: ErrorCode.DOC_FORMAT_UNSUPPORTED,
        message: 'Formato .xyz non supportato',
        source: 'ElectronRenderer',
      };

      const result = service.handle(rawError);

      expect(result.code).toBe(ErrorCode.DOC_FORMAT_UNSUPPORTED);
      expect(result.message).toBe('Formato .xyz non supportato');
      expect(result.source).toBe('ElectronRenderer');
      expect(result.category).toBe(ErrorCategory.IO);
    });

    it("dovrebbe fare fallback su SEARCH_ENGINE_ERROR se l'oggetto non ha un codice riconosciuto", () => {
      const rawError = new Error('Errore misterioso nel motore di ricerca');

      const result = service.handle(rawError);

      expect(result.code).toBe(ErrorCode.SEARCH_ENGINE_ERROR);
      expect(result.message).toBe('Errore misterioso nel motore di ricerca');
      expect(result.detail).toBe(rawError.stack);
    });

    it('dovrebbe dedurre IPC_ERROR se il messaggio contiene la stringa "ipc"', () => {
      const rawError = new Error('Timeout during IPC communication');

      const result = service.handle(rawError);

      expect(result.code).toBe(ErrorCode.IPC_ERROR);
      expect(result.category).toBe(ErrorCategory.IPC);
    });

    it('dovrebbe gestire stringhe primitive in modo sicuro', () => {
      const result = service.handle('Qualcosa è andato storto');

      expect(result.code).toBe(ErrorCode.SEARCH_ENGINE_ERROR);
      expect(result.message).toBe('Qualcosa è andato storto');
      expect(result.source).toBe('IPC Gateway');
    });
  });
  describe('Casi limite (Edge Cases) e Coverage', () => {
    it('dovrebbe usare la configurazione di default in createError per un codice non mappato (righe 67-77)', () => {
      const error = service.createError(
        'UNMAPPED_CODE' as ErrorCode,
        'Messaggio di test',
        'Test Source',
      );

      expect(error.category).toBe(ErrorCategory.IPC);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.recoverable).toBe(false);
    });

    it("dovrebbe fare fallback se l'oggetto raw ha una proprietà code non presente nell'enum (riga 98)", () => {
      const rawError = {
        code: 'INVALID_OR_FAKE_CODE',
        message: 'Codice di errore sconosciuto',
      };

      const result = service.handle(rawError);

      expect(result.code).toBe(ErrorCode.SEARCH_ENGINE_ERROR);
    });
  });
});
