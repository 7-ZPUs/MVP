import { Injectable, Inject } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { LogEntry } from '../domain';
import {
  ILoggingChannel,
  IElectronContextBridge,
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
} from '../contracts';

@Injectable({ providedIn: 'root' })
export class ElectronLoggingGateway implements ILoggingChannel {
  constructor(
    @Inject(ELECTRON_CONTEXT_BRIDGE_TOKEN) private readonly contextBridge: IElectronContextBridge,
  ) {}

  public writeLog(entry: LogEntry): Observable<void> {
    return new Observable<void>((observer: Observer<void>) => {
      this.contextBridge
        .invoke<void>('ipc:log:write', entry)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((err) => {
          observer.error(err);
        });
    });
  }
}
