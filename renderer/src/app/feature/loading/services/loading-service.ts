import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IpcChannels } from '@shared/ipc-channels';

type BootstrapEventHandler = () => void;

type ElectronBridge = {
  invoke?: <T = unknown>(channel: string, data?: unknown) => Promise<T>;
  on?: (channel: string, handler: BootstrapEventHandler) => (() => void) | void;
  receive?: (channel: string, handler: BootstrapEventHandler) => (() => void) | void;
};

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly ngZone = inject(NgZone);
  private readonly isLoaded$ = new BehaviorSubject<boolean>(false);
  public readonly loadingStatus$ = this.isLoaded$.asObservable();

  constructor() {
    const bridge = this.resolveBridge();
    if (!bridge) {
      console.warn('[LoadingService] electron bridge non disponibile nel renderer.');
      return;
    }

    const listen = bridge.on ?? bridge.receive;
    if (typeof listen === 'function') {
      listen(IpcChannels.BOOTSTRAP_COMPLETE, () => {
        this.markLoaded();
      });
    }

    if (typeof bridge.invoke === 'function') {
      void bridge
        .invoke<boolean>(IpcChannels.BOOTSTRAP_STATUS)
        .then((isCompleted) => {
          if (isCompleted) {
            this.markLoaded();
          }
        })
        .catch((error) => {
          console.warn('[LoadingService] impossibile leggere lo stato bootstrap:', error);
        });
    }
  }

  private resolveBridge(): ElectronBridge | null {
    const w = globalThis.window as Window & {
      electronAPI?: ElectronBridge;
      electron?: ElectronBridge;
      api?: ElectronBridge;
    };

    return w.electronAPI ?? w.electron ?? w.api ?? null;
  }

  private markLoaded(): void {
    this.ngZone.run(() => {
      if (!this.isLoaded$.value) {
        this.isLoaded$.next(true);
      }
    });
  }
}
