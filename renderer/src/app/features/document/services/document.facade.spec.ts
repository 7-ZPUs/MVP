import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { DocumentFacade } from './document.facade';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { ErrorCode, ErrorCategory, ErrorSeverity, AppError } from '../../../shared/domain';
import { DocumentDetail, MimeType } from '../domain/document.models';
import { IpcChannels } from '../../../../../../shared/ipc-channels';

describe('DocumentFacade', () => {
  // (o 'DocumentFacade')
  let facade: DocumentFacade; // (o DocumentFacade)

  // Usiamo 'any' (o un casting) per zittire TypeScript.
  // Nei test è una pratica comune per i mock, poiché a noi interessa
  // solo simulare le funzioni specifiche che il Facade andrà a chiamare, non l'intera classe.
  let mockGateway: any;
  let mockCache: any;
  let mockTelemetry: any;
  let mockErrorHandler: any;

  const mockDocumentData: DocumentDetail = {
    documentId: '456',
    fileName: 'determina_sindacale.pdf',
    mimeType: MimeType.PDF,
    metadata: {
      identificativo: 'DOC-456',
      impronta: 'ABC123HASH',
      algoritmoImpronta: 'SHA-256',
      nome: 'Determina',
      oggetto: '',
      descrizione: 'Documento di test per i Facade',
      tipoDocumentale: 'Deliberazione',
      modalitaFormazione: 'Nativa Digitale',
      riservatezza: 'Ordinaria',
      versione: '1.0',
    },
    registration: {
      flusso: 'E',
      tipoRegistro: 'Protocollo Ufficiale',
      data: '2023-10-15',
      numero: '0001234',
      codice: 'AOO_TEST',
    },
    classification: {
      indice: '1.1',
      descrizione: 'Delibere Sindacali',
      uriPiano: 'http://example.com/piano-classificazione/1.1',
    },
    format: {
      tipo: 'PDF/A-3',
      prodotto: 'Adobe Acrobat',
      versione: '2020',
      produttore: 'Adobe Systems',
    },
    verification: {
      firmaDigitale: 'Valida',
      sigillo: 'Non presente',
      marcaturaTemporale: 'Valida',
      conformitaCopie: 'Conforme',
    },
    attachments: {
      numero: 0,
      allegati: [],
    },
    changeTracking: {
      tipo: 'Creazione',
      soggetto: 'Mario Rossi',
      data: '2023-10-15T10:00:00Z',
      idVersionePrecedente: '',
    },
    aipInfo: {
      classeDocumentale: 'Delibera',
      uuid: '550e8400-e29b-41d4-a716-446655440000',
    },
  };

  // Il mock per il file fisico (una finta sequenza di byte)
  const mockBlob = new Uint8Array([80, 68, 70, 45, 49, 46, 52]); // Finti byte di un PDF

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
        DocumentFacade, // <-- Ricordati di cambiare in DocumentFacade nell'altro file

        // Forniamo i nostri mock al posto dei servizi reali
        { provide: IPC_GATEWAY_TOKEN, useValue: mockGateway },
        { provide: IpcCacheService, useValue: mockCache },
        { provide: TelemetryService, useValue: mockTelemetry },
        { provide: IpcErrorHandlerService, useValue: mockErrorHandler },
      ],
    });

    facade = TestBed.inject(DocumentFacade); // <-- Cambia in DocumentFacade nell'altro file
  });

  // --- TEST CARICAMENTO METADATI ---
  it('dovrebbe chiamare il gateway per i metadati e usare cache a 5 min (Cache Miss)', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockResolvedValue(mockDocumentData);

    await facade.loadDocument('456');

    expect(mockGateway.invoke).toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_DOCUMENT_BY_ID,
      456,
      null,
    );
    expect(mockCache.set).toHaveBeenCalledWith('document:456', expect.any(Object), 300000); // 5 min
    expect(facade.getState()().detail).toBeTruthy();
  });

  it('dovrebbe usare i metadati dalla cache (Cache Hit) e non chiamare il gateway', async () => {
    (mockCache.get as Mock).mockReturnValue(mockDocumentData);

    await facade.loadDocument('456');

    expect(mockGateway.invoke).not.toHaveBeenCalled();
    expect(mockCache.get).toHaveBeenCalledWith('document:456');
    expect(facade.getState()().detail).toEqual(mockDocumentData);
  });

  it('dovrebbe ignorare risposte obsolete a causa di race condition (activeLoadRequestId)', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    let resolveFirst: any;
    const firstCallPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    (mockGateway.invoke as Mock).mockImplementation((channel, id) => {
      if (id === 456) return firstCallPromise;
      if (id === 457) return Promise.resolve({ ...mockDocumentData, documentId: '457' });
      return Promise.resolve(null);
    });

    // Avviamo due chiamate sequenziali per generare race condition simulata
    const promise1 = facade.loadDocument('456');
    const promise2 = facade.loadDocument('457');

    resolveFirst(mockDocumentData);
    await Promise.all([promise1, promise2]);

    const state = facade.getState()();
    // Lo stato finale dovrebbe riflettere la SECONDA chiamata (457), non la prima che arriva in ritardo
    expect(state.detail?.documentId).toBe('457');
  });

  it('dovrebbe determinare il mimeType in fallback in base al file fisico', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockImplementation(async (channel, payload) => {
      if (channel === IpcChannels.BROWSE_GET_DOCUMENT_BY_ID) {
        return { ...mockDocumentData, mimeType: MimeType.UNSUPPORTED };
      }
      if (channel === IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT) {
        return [{ id: 1, isMain: true, filename: 'test.jpg' }];
      }
      return null;
    });

    await facade.loadDocument('456');
    expect(facade.getState()().detail?.mimeType).toBe(MimeType.IMAGE);
  });

  it('dovrebbe gestire un errore di rete/Gateway durante il caricamento dei metadati', async () => {
    const rawError = new Error('Network error');
    const mappedError: AppError = {
      code: ErrorCode.IPC_ERROR,
      message: 'Network error',
      source: 'Gateway',
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
      context: null,
      detail: null,
    };
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockRejectedValue(rawError);
    (mockErrorHandler.handle as Mock).mockReturnValue(mappedError);

    await facade.loadDocument('456');
    expect(facade.getState()().error).toEqual(mappedError);
  });

  // --- TEST CARICAMENTO BLOB (FILE FISICO) ---
  it('dovrebbe chiamare il gateway per il Blob e usare cache a 1 min (Cache Miss)', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock)
      .mockResolvedValueOnce([{ id: 999, isMain: true }])
      .mockResolvedValueOnce(mockBlob);

    const result = await facade.getFileBlob('456');

    expect(mockGateway.invoke).toHaveBeenNthCalledWith(
      1,
      IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
      456,
      null,
    );
    expect(mockGateway.invoke).toHaveBeenNthCalledWith(
      2,
      IpcChannels.BROWSE_GET_FILE_BUFFER_BY_ID,
      999,
      null,
    );
    expect(mockGateway.invoke).not.toHaveBeenCalledWith(
      IpcChannels.BROWSE_GET_FILE_BY_ID,
      456,
      null,
    );
    expect(mockCache.set).toHaveBeenCalledWith('blob:456', mockBlob, 60000); // 1 min
    expect(result).toEqual(mockBlob);
  });

  it('dovrebbe recuperare il blob direttamente dalla cache (Cache Hit)', async () => {
    (mockCache.get as Mock).mockReturnValue(mockBlob);

    const result = await facade.getFileBlob('456');

    expect(mockGateway.invoke).not.toHaveBeenCalled();
    expect(result).toEqual(mockBlob);
  });

  it("dovrebbe lanciare un errore se l'id non e numerico", async () => {
    const errorMsg = 'ID documento non numerico per il recupero file: abc';
    (mockErrorHandler.handle as Mock).mockImplementation((err) => err);

    await expect(facade.getFileBlob('abc')).rejects.toThrow(errorMsg);
  });

  it('dovrebbe lanciare un errore se nessun file e associato', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockResolvedValueOnce([]); // No files
    (mockErrorHandler.handle as Mock).mockImplementation((err) => err);

    await expect(facade.getFileBlob('456')).rejects.toThrow(
      'Nessun file associato a questo documento.',
    );
  });

  it('dovrebbe lanciare un errore se il rawBlob e nullo', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock)
      .mockResolvedValueOnce([{ id: 999, isMain: true }])
      .mockResolvedValueOnce(null);
    (mockErrorHandler.handle as Mock).mockImplementation((err) => err);

    await expect(facade.getFileBlob('456')).rejects.toThrow(
      'Impossibile caricare il contenuto del file.',
    );
  });

  it('dovrebbe gestire la conversione di rawBlob in Uint8Array', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock)
      .mockResolvedValueOnce([{ id: 999, isMain: true }])
      .mockResolvedValueOnce([80, 68, 70]); // Array normale invece di Uint8Array

    const result = await facade.getFileBlob('456');

    expect(result).toBeInstanceOf(Uint8Array);
  });

  // --- TEST ERRORI BLOB ---
  it('dovrebbe gestire un errore durante il recupero del blob e lanciare un AppError', async () => {
    const rawError = new Error('File corrotto');
    const mappedError: AppError = {
      code: ErrorCode.DOC_BLOB_LOAD_ERROR,
      message: 'File corrotto',
      source: 'Gateway',
      category: ErrorCategory.IO,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
      context: null,
      detail: null,
    };

    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockRejectedValue(rawError);
    (mockErrorHandler.handle as Mock).mockReturnValue(mappedError);

    // Verifichiamo che il metodo propaghi l'AppError per farlo gestire al DocumentViewerComponent
    await expect(facade.getFileBlob('456')).rejects.toEqual(mappedError);
    expect(mockTelemetry.trackError).toHaveBeenCalledWith(mappedError);
  });
});
