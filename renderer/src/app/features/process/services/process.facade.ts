import { Injectable, Signal, inject, signal } from '@angular/core';
import { IProcessFacade } from '../contracts/IProcessFacade';
import { ProcessDetail, ProcessState } from '../domain/process.models';
import { mapProcessDtoToDetail } from '../mappers/process.mapper';
import { IPC_GATEWAY_TOKEN } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { TelemetryMetric } from '../../../shared/domain';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { DocumentDTO } from '../../../shared/domain/dto/DocumentDTO';
import { DocumentClassDTO } from '../../../shared/domain/dto/DocumentClassDTO';
import { mapDocumentsToIndexEntries } from '../../../shared/utils/document-index.util';

interface ProcessProbe {
  id?: unknown;
}

@Injectable()
export class ProcessFacade implements IProcessFacade {
  private readonly ipcGateway = inject(IPC_GATEWAY_TOKEN);
  private readonly cache = inject(IpcCacheService);
  private readonly telemetry = inject(TelemetryService);
  private readonly errorHandler = inject(IpcErrorHandlerService);

  private readonly state = signal<ProcessState>({
    detail: null,
    loading: false,
    error: null,
  });

  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly CACHE_PREFIX = 'process:';
  private readonly EMPTY_DOCUMENTS_RETRY_DELAY_MS = 120;
  private activeLoadRequestId = 0;

  public getState(): Signal<ProcessState> {
    return this.state.asReadonly();
  }

  public async isProcess(id: string): Promise<boolean> {
    const numericId = this.toNumericId(id);
    if (numericId === null) {
      return false;
    }

    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cachedDetail = this.cache.get<ProcessDetail>(cacheKey);
    if (cachedDetail) {
      return true;
    }

    try {
      const dto = await this.ipcGateway.invoke<ProcessProbe | null>(
        IpcChannels.BROWSE_GET_PROCESS_BY_ID,
        numericId,
        null,
      );
      return Boolean(dto && dto.id !== undefined && dto.id !== null);
    } catch {
      return false;
    }
  }

  public async loadProcess(id: string): Promise<void> {
    const requestId = ++this.activeLoadRequestId;
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    this.state.update((current) => ({ ...current, loading: true, error: null, detail: null }));

    try {
      const cachedDetail = this.cache.get<ProcessDetail>(cacheKey);
      if (cachedDetail) {
        if (requestId !== this.activeLoadRequestId) {
          return;
        }

        this.state.update((current) => ({ ...current, detail: cachedDetail, loading: false }));
        this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
        return;
      }

      const numericId = this.toNumericId(id);
      if (numericId === null) {
        throw new Error(`ID processo non valido: ${id}`);
      }

      const rawProcess = await this.ipcGateway.invoke(
        IpcChannels.BROWSE_GET_PROCESS_BY_ID,
        numericId,
        null,
      );

      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      const processDetail = mapProcessDtoToDetail(rawProcess);
      const [documents, documentClass] = await Promise.all([
        this.fetchDocumentsByProcessWithRetry(numericId),
        this.fetchDocumentClass(processDetail.documentClass.id),
      ]);

      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      processDetail.indiceDocumenti = mapDocumentsToIndexEntries(documents);
      if (documentClass) {
        processDetail.documentClass = {
          id: documentClass.id,
          name: documentClass.name,
          uuid: documentClass.uuid,
          timestamp: documentClass.timestamp,
        };
      }

      this.cache.set(cacheKey, processDetail, this.CACHE_TTL_MS);

      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      this.state.update((current) => ({ ...current, detail: processDetail, loading: false }));
      this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
    } catch (error) {
      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      const appError = this.errorHandler.handle(error);
      this.state.update((current) => ({ ...current, error: appError, loading: false }));
      this.telemetry.trackError(appError);
    }
  }

  private async fetchDocumentClass(documentClassId: number | null): Promise<DocumentClassDTO | null> {
    if (!documentClassId || !Number.isFinite(documentClassId)) {
      return null;
    }

    try {
      const dto = await this.ipcGateway.invoke<DocumentClassDTO | null>(
        IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID,
        documentClassId,
        null,
      );
      return dto;
    } catch {
      return null;
    }
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

  private toNumericId(id: string): number | null {
    const parsed = Number(id);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
