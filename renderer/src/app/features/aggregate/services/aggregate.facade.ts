import { Injectable, Inject, signal, Signal } from '@angular/core';
import { IAggregateFacade } from '../contracts/IAggregateFacade';
import { AggregateState } from '../domain/aggregate.models';
import { AggregateDetailDTO, DocumentIndexEntryDTO } from '../../../shared/domain/dto/AggregateDTO';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { TelemetryMetric } from '../../../shared/domain';
import { mapProcessDtoToAggregateDetail } from '../mappers/aggregate.mapper';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { DocumentDTO } from '../../../shared/domain/dto/DocumentDTO';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';

@Injectable() // Injectable senza 'root' perché verrà fornito dalle rotte
export class AggregateFacade implements IAggregateFacade {
  // Stato reattivo usando i Signal di Angular 17
  private readonly state = signal<AggregateState>({
    detail: null,
    loading: false,
    error: null,
  });

  // Costanti di business (dal diagramma C4)
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti
  private readonly CACHE_PREFIX = 'aggregate:';
  private readonly EMPTY_DOCUMENTS_RETRY_DELAY_MS = 120;
  private activeLoadRequestId = 0;

  constructor(
    @Inject(IPC_GATEWAY_TOKEN) private readonly ipcGateway: IIpcGateway,
    private readonly cache: IpcCacheService,
    private readonly telemetry: TelemetryService,
    private readonly errorHandler: IpcErrorHandlerService,
  ) {}

  public getState(): Signal<AggregateState> {
    return this.state.asReadonly();
  }

  public async loadAggregate(id: string): Promise<void> {
    const requestId = ++this.activeLoadRequestId;
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Resettiamo lo stato prima di caricare
    this.state.update((s) => ({ ...s, loading: true, error: null, detail: null }));

    try {
      // 1. Logica Cache-First
      const cachedDetail = this.cache.get<AggregateDetailDTO>(cacheKey);

      if (cachedDetail) {
        if (requestId !== this.activeLoadRequestId) {
          return;
        }
        this.state.update((s) => ({ ...s, detail: cachedDetail, loading: false }));
        this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
        return;
      }

      // 2. Chiamata IPC (Cache Miss)
      // Nota: Il payload e il channel esatti dipenderanno dal tuo contratto backend
      const rawData = await this.ipcGateway.invoke(
        IpcChannels.BROWSE_GET_PROCESS_BY_ID,
        Number(id),
        null,
      );

      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      // Qui ipotizziamo che il gateway restituisca già l'oggetto formattato o che tu faccia un mapping
      const aggregateDetail = mapProcessDtoToAggregateDetail(rawData);
      const relatedDocuments = await this.fetchDocumentsByProcessWithRetry(Number(id));

      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      aggregateDetail.indiceDocumenti = this.mapDocumentIndexEntries(relatedDocuments);

      // 3. Salvataggio in Cache
      this.cache.set(cacheKey, aggregateDetail, this.CACHE_TTL_MS);

      // 4. Aggiornamento Stato
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      this.state.update((s) => ({ ...s, detail: aggregateDetail, loading: false }));
      this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
    } catch (error) {
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      // 5. Gestione Errori Centralizzata
      const appError = this.errorHandler.handle(error);
      this.state.update((s) => ({ ...s, error: appError, loading: false }));
      this.telemetry.trackError(appError);
    }
  }

  private mapDocumentIndexEntries(documents: DocumentDTO[] | null | undefined): DocumentIndexEntryDTO[] {
    if (!Array.isArray(documents) || documents.length === 0) {
      return [];
    }

    return documents.map((document) => {
      const extractor = new MetadataExtractor(Array.isArray(document.metadata) ? document.metadata : []);
      const displayLabel = this.resolveDocumentLabel(document, extractor);

      return {
        tipoDocumento: 'Documento',
        identificativo: displayLabel,
        routeId: String(document.id),
      };
    });
  }

  private resolveDocumentLabel(document: DocumentDTO, extractor: MetadataExtractor): string {
    const candidates = [
      extractor.getString('NomeDelDocumento', '').trim(),
      extractor.getString('Oggetto', '').trim(),
      document.uuid?.trim() || '',
    ];

    for (const candidate of candidates) {
      if (candidate.length > 0) {
        return candidate;
      }
    }

    return 'Documento';
  }

  private async fetchDocumentsByProcessWithRetry(processId: number): Promise<DocumentDTO[]> {
    const firstAttempt = await this.ipcGateway.invoke<DocumentDTO[]>(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
      processId,
      null,
    );

    if (Array.isArray(firstAttempt) && firstAttempt.length > 0) {
      return firstAttempt;
    }

    await this.delay(this.EMPTY_DOCUMENTS_RETRY_DELAY_MS);

    const secondAttempt = await this.ipcGateway.invoke<DocumentDTO[]>(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
      processId,
      null,
    );

    return Array.isArray(secondAttempt) ? secondAttempt : [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
