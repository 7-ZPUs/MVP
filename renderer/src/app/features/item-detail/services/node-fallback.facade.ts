import { Injectable, Signal, inject, signal } from '@angular/core';
import { INodeFallbackFacade } from '../contracts/INodeFallbackFacade';
import {
  NodeFallbackDetail,
  NodeFallbackItemType,
  NodeFallbackRelatedItem,
  NodeFallbackState,
} from '../domain/node-fallback.models';
import { IPC_GATEWAY_TOKEN } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { TelemetryMetric } from '../../../shared/domain';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { DipDTO } from '../../../shared/domain/dto/DipDTO';
import { DocumentClassDTO } from '../../../shared/domain/dto/DocumentClassDTO';
import { FileDTO } from '../../../shared/domain/dto/FileDTO';
import { ProcessDTO } from '../../../shared/domain/dto/ProcessDTO';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';
import { normalizeDisplayFileName } from '../../../shared/utils/display-file-name.util';
import { normalizeMetadataNodes } from '../../../shared/utils/metadata-nodes.util';

@Injectable()
export class NodeFallbackFacade implements INodeFallbackFacade {
  private readonly ipcGateway = inject(IPC_GATEWAY_TOKEN);
  private readonly cache = inject(IpcCacheService);
  private readonly telemetry = inject(TelemetryService);
  private readonly errorHandler = inject(IpcErrorHandlerService);

  private readonly state = signal<NodeFallbackState>({
    detail: null,
    loading: false,
    error: null,
  });

  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly CACHE_PREFIX = 'node-fallback:';
  private activeLoadRequestId = 0;

  getState(): Signal<NodeFallbackState> {
    return this.state.asReadonly();
  }

  async loadNode(itemType: NodeFallbackItemType, id: string): Promise<void> {
    const requestId = ++this.activeLoadRequestId;
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}${itemType}:${id}`;
    this.state.update((current) => ({ ...current, loading: true, error: null, detail: null }));

    try {
      const cachedDetail = this.cache.get<NodeFallbackDetail>(cacheKey);
      if (cachedDetail) {
        if (requestId !== this.activeLoadRequestId) {
          return;
        }
        this.state.set({ detail: cachedDetail, loading: false, error: null });
        this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
        return;
      }

      const numericId = this.toNumericId(id);
      const detail = await this.fetchDetail(itemType, numericId);
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      this.cache.set(cacheKey, detail, this.CACHE_TTL_MS);
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      this.state.set({ detail, loading: false, error: null });
      this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
    } catch (error) {
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      const appError = this.errorHandler.handle(error);
      this.state.set({ detail: null, loading: false, error: appError });
      this.telemetry.trackError(appError);
    }
  }

  private async fetchDetail(itemType: NodeFallbackItemType, nodeId: number): Promise<NodeFallbackDetail> {
    switch (itemType) {
      case 'DIP':
        return this.loadDipDetail(nodeId);
      case 'DOCUMENT_CLASS':
        return this.loadDocumentClassDetail(nodeId);
      case 'FILE':
        return this.loadFileDetail(nodeId);
    }
  }

  private async loadDipDetail(nodeId: number): Promise<NodeFallbackDetail> {
    const dto = await this.ipcGateway.invoke<DipDTO | null>(IpcChannels.BROWSE_GET_DIP_BY_ID, nodeId, null);
    if (!dto) {
      throw new Error(`DIP non trovato: ${nodeId}`);
    }

    return {
      type: 'DIP',
      typeLabel: 'DIP',
      title: this.buildNodeTitle('DIP'),
      subtitle: 'Nodo radice del pacchetto documentale',
      fields: [
        { label: 'UUID', value: dto.uuid || 'N/D' },
        { label: 'Stato verifica', value: dto.integrityStatus || 'UNKNOWN' },
      ],
      hint: 'Questo nodo contiene metadati essenziali. Per i dettagli operativi continua con Classi Documentali e Processi.',
    };
  }

  private async loadDocumentClassDetail(nodeId: number): Promise<NodeFallbackDetail> {
    const dto = await this.ipcGateway.invoke<DocumentClassDTO | null>(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID,
      nodeId,
      null,
    );
    if (!dto) {
      throw new Error(`Classe Documentale non trovata: ${nodeId}`);
    }

    const processes = await this.ipcGateway.invoke<ProcessDTO[]>(
      IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
      nodeId,
      null,
    );
    const relatedProcesses = this.mapRelatedProcesses(processes);

    const preferredTitle = dto.name?.trim();
    const title =
      preferredTitle && preferredTitle.length > 0
        ? preferredTitle
        : this.buildNodeTitle('DOCUMENT_CLASS');

    return {
      type: 'DOCUMENT_CLASS',
      typeLabel: 'Classe Documentale',
      title,
      subtitle: 'Classificazione documentale',
      fields: [
        { label: 'Nome', value: title },
        { label: 'UUID', value: dto.uuid || 'N/D' },
        { label: 'Stato verifica', value: dto.integrityStatus || 'UNKNOWN' },
        { label: 'Marcatura temporale', value: dto.timestamp || 'N/D' },
      ],
      relatedSection: {
        title: 'Processi associati',
        emptyMessage: 'Nessun processo associato a questa classe documentale.',
        items: relatedProcesses,
      },
      hint:
        relatedProcesses.length === 0
          ? 'I metadati di processo verranno mostrati qui quando disponibili.'
          : undefined,
    };
  }

  private async loadFileDetail(nodeId: number): Promise<NodeFallbackDetail> {
    const dto = await this.ipcGateway.invoke<FileDTO | null>(IpcChannels.BROWSE_GET_FILE_BY_ID, nodeId, null);
    if (!dto) {
      throw new Error(`File non trovato: ${nodeId}`);
    }

    const displayName = normalizeDisplayFileName(dto.filename);
    const title = displayName || this.buildNodeTitle('FILE');

    return {
      type: 'FILE',
      typeLabel: 'File',
      title,
      subtitle: 'Risorsa associata al documento',
      fields: [
        { label: 'Nome file', value: title },
        { label: 'Stato verifica', value: dto.integrityStatus || 'UNKNOWN' },
        { label: 'Hash', value: dto.hash || 'N/D' },
        { label: 'File principale', value: dto.isMain ? 'Si' : 'No' },
      ],
      hint: 'Per l anteprima e i metadati estesi apri il nodo Documento padre.',
    };
  }

  private mapRelatedProcesses(processes: ProcessDTO[] | null | undefined): NodeFallbackRelatedItem[] {
    if (!Array.isArray(processes) || processes.length === 0) {
      return [];
    }

    return processes.map((process) => ({
      itemType: 'PROCESS',
      itemId: String(process.id),
      label: this.resolveProcessLabel(process),
      description: `UUID: ${process.uuid || 'N/D'} - Stato: ${process.integrityStatus || 'UNKNOWN'}`,
    }));
  }

  private resolveProcessLabel(process: ProcessDTO): string {
    const extractor = new MetadataExtractor(normalizeMetadataNodes(process.metadata));
    const candidates = [
      extractor.getString('Oggetto', '').trim(),
      extractor.getString('Procedimento', '').trim(),
      extractor.getString('IdAggregazione', '').trim(),
    ];

    for (const candidate of candidates) {
      if (candidate.length > 0) {
        return candidate;
      }
    }

    return process.uuid?.trim() || 'Processo';
  }

  private toNumericId(id: string): number {
    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) {
      throw new Error(`ID nodo non valido: ${id}`);
    }

    return parsedId;
  }

  private buildNodeTitle(type: NodeFallbackItemType): string {
    switch (type) {
      case 'DIP':
        return 'DIP';
      case 'DOCUMENT_CLASS':
        return 'Classe Documentale';
      case 'FILE':
        return 'File';
    }
  }
}