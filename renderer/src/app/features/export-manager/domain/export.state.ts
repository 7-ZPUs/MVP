import { Injectable, Signal, computed, signal } from '@angular/core';
import { ExportError, ExportResult, DownloadQueueItem }             from './models';
import { ExportPhase, OutputContext }             from './enums';
 
export interface ExportStateSnapshot {
    phase:         ExportPhase;
    outputContext: OutputContext | null;
    result:        ExportResult | null;
    progress:      number;
    error:         ExportError | null;
    loading:       boolean;
    queue:         DownloadQueueItem[];
}

const INITIAL: ExportStateSnapshot = {
    phase:         ExportPhase.IDLE,
    outputContext: null,
    result:        null,
    progress:      0,
    error:         null,
    loading:       false,
    queue:         [],
};
 
@Injectable({ providedIn: 'root' })
export class ExportState {
 
  private readonly _state = signal<ExportStateSnapshot>({ ...INITIAL });
  readonly queue: Signal<DownloadQueueItem[]> = computed(() => this._state().queue);

  initQueue(items: DownloadQueueItem[]): void {
    this._state.update(s => ({ ...s, queue: items }));
  }

  updateQueueItem(fileId: number, patch: Partial<DownloadQueueItem>): void {
    this._state.update(s => ({
        ...s,
        queue: s.queue.map(item =>
            item.fileId === fileId ? { ...item, ...patch } : item
        ),
    }));
  }
 
  // Segnali pubblici derivati — i componenti leggono solo questi
  readonly phase:         Signal<ExportPhase>          = computed(() => this._state().phase);
  readonly outputContext: Signal<OutputContext | null>  = computed(() => this._state().outputContext);
  readonly result:        Signal<ExportResult | null>  = computed(() => this._state().result);
  readonly progress:      Signal<number>               = computed(() => this._state().progress);
  readonly error:         Signal<ExportError | null>   = computed(() => this._state().error);
  readonly loading:       Signal<boolean>              = computed(() => this._state().loading);
 
  setProcessing(context: OutputContext): void {
    this._state.update(s => ({
      ...s,
      phase:         ExportPhase.PROCESSING,
      outputContext: context,
      loading:       true,
      progress:      0,
      error:         null,
      result:        null,
    }));
  }
 
  setProgress(progress: number): void {
    this._state.update(s => ({ ...s, progress: Math.min(100, Math.round(progress)) }));
  }
 
  setSuccess(result: ExportResult): void {
    this._state.update(s => ({
      ...s,
      phase:    ExportPhase.SUCCESS,
      result,
      loading:  false,
      progress: 100,
      error:    null,
    }));
  }
 
  setError(error: ExportError): void {
    this._state.update(s => ({
      ...s,
      phase:   ExportPhase.ERROR,
      error,
      loading: false,
    }));
  }
 
  setUnavailable(error: ExportError): void {
    this._state.update(s => ({
      ...s,
      phase:   ExportPhase.UNAVAILABLE,
      error,
      loading: false,
    }));
  }
 
  getSnapshot(): ExportStateSnapshot { return this._state(); }
 
  reset(): void {
    this._state.set({ ...INITIAL });
  }
}