import { Injectable, Inject, signal, Signal } from '@angular/core';
import { IDocumentFacade } from '../contracts/IDocumentFacade';
import { DocumentState, DocumentDetail } from '../domain/document.models';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { TelemetryMetric } from '../../../shared/domain';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { mapDocumentDtoToDetail } from '../mappers/document.mapper';

@Injectable()
export class DocumentFacade implements IDocumentFacade {
  // Stato reattivo usando i Signal
  private readonly state = signal<DocumentState>({
    detail: null,
    loading: false,
    error: null,
  });

  // Costanti di business per la Cache, dai diagrammi C4
  private readonly CACHE_TTL_METADATA_MS = 5 * 60 * 1000; // 5 min
  private readonly CACHE_TTL_BLOB_MS = 1 * 60 * 1000; // 1 min

  private readonly PREFIX_DOC = 'document:';
  private readonly PREFIX_BLOB = 'blob:';
  private activeLoadRequestId = 0;

  constructor(
    @Inject(IPC_GATEWAY_TOKEN) private readonly ipcGateway: IIpcGateway,
    private readonly cache: IpcCacheService,
    private readonly telemetry: TelemetryService,
    private readonly errorHandler: IpcErrorHandlerService,
  ) {}

  public getState(): Signal<DocumentState> {
    return this.state.asReadonly();
  }

  // --- 1. CARICAMENTO METADATI DEL DOCUMENTO ---
  public async loadDocument(id: string): Promise<void> {
    const requestId = ++this.activeLoadRequestId;
    const startTime = Date.now();
    const cacheKey = `${this.PREFIX_DOC}${id}`;

    this.state.update((s) => ({ ...s, loading: true, error: null, detail: null }));

    try {
      // Strategia Cache-First (5 min)
      const cachedDetail = this.cache.get<DocumentDetail>(cacheKey);

      if (cachedDetail) {
        if (requestId !== this.activeLoadRequestId) {
          return;
        }
        this.state.update((s) => ({ ...s, detail: cachedDetail, loading: false }));
        this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
        return;
      }

      // Chiamata IPC se non in cache
      const rawData = await this.ipcGateway.invoke(
        IpcChannels.BROWSE_GET_DOCUMENT_BY_ID,
        Number(id),
        null,
      );

      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      const documentDetail = mapDocumentDtoToDetail(rawData);

      // Salvataggio e aggiornamento stato
      this.cache.set(cacheKey, documentDetail, this.CACHE_TTL_METADATA_MS);
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      this.state.update((s) => ({ ...s, detail: documentDetail, loading: false }));
      this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
    } catch (error) {
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      const appError = this.errorHandler.handle(error);
      this.state.update((s) => ({ ...s, error: appError, loading: false }));
      this.telemetry.trackError(appError);
    }
  }

  // --- 2. CARICAMENTO DEL BLOB FISICO (PDF/Immagine) ---
  public async getFileBlob(documentId: string): Promise<Uint8Array> {
    const startTime = Date.now();
    const cacheKey = `${this.PREFIX_BLOB}${documentId}`;
    const numericDocumentId = Number(documentId);

    if (!Number.isFinite(numericDocumentId)) {
      throw this.errorHandler.handle(
        new Error(`ID documento non numerico per il recupero file: ${documentId}`),
      );
    }

    try {
      // Strategia Cache-First (1 min)
      const cachedBlob = this.cache.get<Uint8Array>(cacheKey);
      if (cachedBlob) {
        return cachedBlob;
      }

      // Passaggio 1: Trovare l'ID del File associato a questo Documento
      const files = (await this.ipcGateway.invoke(
        IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
        numericDocumentId,
        null,
      )) as { id: number; isMain: boolean }[];

      if (!files || files.length === 0) {
        throw new Error('Nessun file associato a questo documento.');
      }

      // Prendiamo il file principale, altrimenti il primo
      const mainFile = files.find((f) => f.isMain) || files[0];

      // Passaggio 2: Chiamata IPC per ricevere il buffer
      const rawBlob = await this.ipcGateway.invoke(
        IpcChannels.BROWSE_GET_FILE_BUFFER_BY_ID,
        mainFile.id,
        null,
      );

      if (!rawBlob) {
        throw new Error(
          'Impossibile caricare il contenuto del file. Il file potrebbe non esistere sul disco.',
        );
      }

      const blob = rawBlob instanceof Uint8Array ? rawBlob : Uint8Array.from(rawBlob as any);

      // Salvataggio Blob in cache (Solo 1 min per non intasare la RAM)
      this.cache.set(cacheKey, blob, this.CACHE_TTL_BLOB_MS);
      this.telemetry.trackTiming(TelemetryMetric.BLOB_LOAD_TIME_MS, Date.now() - startTime); // Idealmente DOC_BLOB_LATENCY

      return blob;
    } catch (error) {
      // Catturiamo l'errore, lo mappiamo, lo tracciamo, e lo rilanciamo verso la UI
      // In modo che il DocumentViewerComponent possa mostrarlo
      const appError = this.errorHandler.handle(error);
      this.telemetry.trackError(appError);
      throw appError;
    }
  }
}
