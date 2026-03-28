import { Injectable, Inject, signal, Signal } from '@angular/core';
import {
  IOutputFacade,
  OutputContext,
  OUTPUT_FACADE_TOKEN,
} from '../../../shared/interfaces/output.interfaces';
import { IPC_GATEWAY_TOKEN, IIpcGateway } from '../../../shared/interfaces/ipc-gateway.interfaces';
import { IpcErrorHandlerService } from '../../../shared/infrastructure/ipc-error-handler.service';
import { TelemetryService } from '../../../shared/infrastructure/telemetry.service';
import { TelemetryEvent } from '../../../shared/domain';

@Injectable()
export class OutputFacade implements IOutputFacade {
  private readonly _isWorking = signal<boolean>(false);
  public readonly isWorking = this._isWorking.asReadonly();

  constructor(
    @Inject(IPC_GATEWAY_TOKEN) private readonly ipcGateway: IIpcGateway,
    private readonly errorHandler: IpcErrorHandlerService,
    private readonly telemetry: TelemetryService,
  ) {}

  public async print(context: OutputContext): Promise<void> {
    await this.executeAction('ipc:output:print', context);
  }

  public async exportPdf(context: OutputContext): Promise<void> {
    await this.executeAction('ipc:output:export-pdf', context);
  }

  public async save(context: OutputContext): Promise<void> {
    await this.executeAction('ipc:output:save', context);
  }

  public async download(context: OutputContext): Promise<void> {
    await this.executeAction('ipc:output:download', context);
  }

  // Metodo helper per non ripetere la logica di Error Handling e Telemetria
  private async executeAction(channel: string, context: OutputContext): Promise<void> {
    this._isWorking.set(true);
    try {
      await this.ipcGateway.invoke(channel, context, null);
      this.telemetry.trackEvent('OUTPUT_ACTION_SUCCESS' as any); // Assumendo che esista
    } catch (error) {
      const appError = this.errorHandler.handle(error);
      this.telemetry.trackError(appError);
      throw appError; // Rilanciamo l'errore per farlo gestire alla UI (es. ErrorDialog)
    } finally {
      this._isWorking.set(false);
    }
  }
}
