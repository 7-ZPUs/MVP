import { Injectable, Inject, signal, Signal } from '@angular/core';
import { IAggregateFacade } from '../contracts/IAggregateFacade';
import { AggregateState } from '../domain/aggregate.models';
import { AggregateDetailDTO } from '../../../shared/domain/dto/AggregateDTO';
import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { TelemetryMetric } from '../../../shared/domain';

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
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Resettiamo lo stato prima di caricare
    this.state.update((s) => ({ ...s, loading: true, error: null, detail: null }));

    try {
      // 1. Logica Cache-First
      const cachedDetail = this.cache.get<AggregateDetailDTO>(cacheKey);

      if (cachedDetail) {
        this.state.update((s) => ({ ...s, detail: cachedDetail, loading: false }));
        this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
        return;
      }

      // 2. Chiamata IPC (Cache Miss)
      // Nota: Il payload e il channel esatti dipenderanno dal tuo contratto backend
      const rawData = await this.ipcGateway.invoke('ipc:aggregate:get', id, null);

      // Qui ipotizziamo che il gateway restituisca già l'oggetto formattato o che tu faccia un mapping
      const aggregateDetail = rawData as AggregateDetailDTO;

      // 3. Salvataggio in Cache
      this.cache.set(cacheKey, aggregateDetail, this.CACHE_TTL_MS);

      // 4. Aggiornamento Stato
      this.state.update((s) => ({ ...s, detail: aggregateDetail, loading: false }));
      this.telemetry.trackTiming(TelemetryMetric.SEARCH_LATENCY_MS, Date.now() - startTime);
    } catch (error) {
      // 5. Gestione Errori Centralizzata
      const appError = this.errorHandler.handle(error);
      this.state.update((s) => ({ ...s, error: appError, loading: false }));
      this.telemetry.trackError(appError);
    }
  }
}
