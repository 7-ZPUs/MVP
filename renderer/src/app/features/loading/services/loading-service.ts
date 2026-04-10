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
  private readonly bridge: ElectronBridge | null = null;

  constructor() {
    this.bridge = this.resolveBridge();
    if (!this.bridge) {
      console.warn('[LoadingService] electron bridge non disponibile nel renderer.');
      return;
    }

    const listen = this.bridge.on ?? this.bridge.receive;
    if (typeof listen === 'function') {
      listen(IpcChannels.BOOTSTRAP_COMPLETE, () => {
        this.markLoaded();
      });
    }

    this.initializeBootstrapStatus();
  }

  private initializeBootstrapStatus(): void {
    if (this.bridge) {
      void this.syncBootstrapStatus(this.bridge);
    }
  }

  private async syncBootstrapStatus(bridge: ElectronBridge): Promise<void> {
    if (typeof bridge.invoke !== 'function') {
      return;
    }

    try {
      const isCompleted = await bridge.invoke<boolean>(IpcChannels.BOOTSTRAP_STATUS);
      if (isCompleted) {
        this.markLoaded();
      }
    } catch (error) {
      console.warn('[LoadingService] impossibile leggere lo stato bootstrap:', error);
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
