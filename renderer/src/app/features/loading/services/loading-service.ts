import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IpcChannels } from '@shared/ipc-channels';
import {
  BOOTSTRAP_LOADING_STATUS,
  BootstrapStatus,
  isBootstrapStatus,
} from '@shared/bootstrap-status';

type BootstrapEventHandler = (...args: unknown[]) => void;

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
  private readonly bootstrapStatusSubject = new BehaviorSubject<BootstrapStatus>(
    BOOTSTRAP_LOADING_STATUS,
  );
  public readonly bootstrapStatus$ = this.bootstrapStatusSubject.asObservable();
  private readonly bridge: ElectronBridge | null = null;

  constructor() {
    this.bridge = this.resolveBridge();
    if (!this.bridge) {
      console.warn('[LoadingService] electron bridge non disponibile nel renderer.');
      return;
    }

    const listen = this.bridge.on ?? this.bridge.receive;
    if (typeof listen === 'function') {
      listen(IpcChannels.BOOTSTRAP_COMPLETE, (...args: unknown[]) => {
        this.applyStatus(args[0]);
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
      const status = await bridge.invoke<unknown>(IpcChannels.BOOTSTRAP_STATUS);
      this.applyStatus(status);
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

  private applyStatus(rawStatus: unknown): void {
    if (typeof rawStatus === 'boolean') {
      this.setStatus(rawStatus ? { state: 'success' } : BOOTSTRAP_LOADING_STATUS);
      return;
    }

    if (isBootstrapStatus(rawStatus)) {
      this.setStatus(rawStatus);
    }
  }

  private setStatus(status: BootstrapStatus): void {
    this.ngZone.run(() => {
      if (this.bootstrapStatusSubject.value.state !== status.state) {
        this.bootstrapStatusSubject.next(status);
        return;
      }

      if (status.message !== this.bootstrapStatusSubject.value.message) {
        this.bootstrapStatusSubject.next(status);
      }
    });
  }
}
