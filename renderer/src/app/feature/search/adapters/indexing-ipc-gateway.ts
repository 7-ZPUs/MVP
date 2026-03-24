import { Injectable, Inject } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { IIndexingChannel } from '../contracts/semantic-index.interface';
import { SemanticIndexState } from '../../../shared/domain/metadata/semantic-filter-models';
import {
  IErrorHandler,
  ERROR_HANDLER_TOKEN,
  IElectronContextBridge,
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
} from '../../../shared/contracts';

@Injectable({ providedIn: 'root' })
export class IndexingIpcGateway implements IIndexingChannel {
  constructor(
    @Inject(ELECTRON_CONTEXT_BRIDGE_TOKEN) private readonly contextBridge: IElectronContextBridge,
    @Inject(ERROR_HANDLER_TOKEN) private readonly errorHandler: IErrorHandler,
  ) {}

  public getIndexingStatus(): Observable<SemanticIndexState> {
    return this.invoke<SemanticIndexState>('ipc:indexing:status', null);
  }

  public cancel(): Observable<void> {
    return this.invoke<void>('ipc:indexing:cancel', null);
  }

  // Metodo privato per standardizzare la conversione Promise -> Observable e la gestione errori
  private invoke<T>(channel: string, payload: unknown): Observable<T> {
    return new Observable<T>((observer: Observer<T>) => {
      this.contextBridge
        .invoke<T>(channel, payload)
        .then((result) => {
          observer.next(result);
          observer.complete();
        })
        .catch((err) => {
          observer.error(this.errorHandler.handle(err));
        });
    });
  }
}
