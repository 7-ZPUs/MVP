import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { DocumentFacade } from './document.facade';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { ErrorCode, ErrorCategory, ErrorSeverity, AppError } from '../../../shared/domain';
import { DocumentDetail, MimeType } from '../domain/document.models';

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
      nome: 'Determina',
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
    conservationProcess: {
      processo: 'PROC-001',
      sessione: 'S1',
      dataInizio: '2023-10-15T10:00:00Z',
    },
    // Aggiungi qui eventuali altri campi obbligatori (es. FormatInfo)
    // se li hai resi strict nell'interfaccia DocumentDetail!
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

    expect(mockGateway.invoke).toHaveBeenCalledWith('ipc:document:get', '456', null);
    expect(mockCache.set).toHaveBeenCalledWith('document:456', mockDocumentData, 300000); // 5 min
    expect(facade.getState()().detail).toEqual(mockDocumentData);
  });

  // --- TEST CARICAMENTO BLOB (FILE FISICO) ---
  it('dovrebbe chiamare il gateway per il Blob e usare cache a 1 min (Cache Miss)', async () => {
    (mockCache.get as Mock).mockReturnValue(null);
    (mockGateway.invoke as Mock).mockResolvedValue(mockBlob);

    const result = await facade.getFileBlob('456');

    expect(mockGateway.invoke).toHaveBeenCalledWith('ipc:document:blob', '456', null);
    expect(mockCache.set).toHaveBeenCalledWith('blob:456', mockBlob, 60000); // 1 min
    expect(result).toEqual(mockBlob);
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
