import { Inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import {
  ISemanticIndexStatus,
  IIndexingChannel,
  INDEXING_CHANNEL_TOKEN,
} from '../contracts/semantic-index.interface';
import { SemanticIndexState } from '../../../shared/domain/metadata/semantic-filter-models';
import { IndexingStatus } from '../../../shared/domain/metadata/search.enum';

@Injectable({ providedIn: 'root' })
export class SemanticIndexFacade implements ISemanticIndexStatus {
  private readonly state: WritableSignal<SemanticIndexState>;
  private readonly timeoutMs: number = 120_000;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(@Inject(INDEXING_CHANNEL_TOKEN) private readonly ipcGateway: IIndexingChannel) {
    this.state = signal<SemanticIndexState>({
      status: IndexingStatus.IDLE,
      progressPercentage: 0,
      lastIndexedAt: null,
    });

    this.startStatusMonitoring();
  }

  public getStatus(): Signal<SemanticIndexState> {
    return this.state.asReadonly();
  }

  private startStatusMonitoring(): void {
    this.resetTimeout();

    this.ipcGateway.getIndexingStatus().subscribe({
      next: (newState: SemanticIndexState) => {
        this.resetTimeout();
        this.state.set(newState);

        if (newState.status === IndexingStatus.READY || newState.status === IndexingStatus.ERROR) {
          this.clearCurrentTimeout();
        }
      },
      error: () => {
        this.clearCurrentTimeout();
        this.state.update((s) => ({ ...s, status: IndexingStatus.ERROR }));
      },
    });
  }

  private resetTimeout(): void {
    this.clearCurrentTimeout();
    this.timeoutHandle = setTimeout(() => {
      this.state.update((s) => ({ ...s, status: IndexingStatus.TIMEOUT }));
    }, this.timeoutMs);
  }

  private clearCurrentTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}
