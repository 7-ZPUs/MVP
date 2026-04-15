import { Injectable, Signal } from '@angular/core';
import { IExportFacade } from '../contracts/i-export-facade';
import { ExportIpcGateway } from '../infrastructure/export-ipc-gateway.service';
import { ExportState } from '../domain/export.state';
import { DownloadQueueItem, ExportError, ExportResult } from '../domain/models';
import { ExportErrorCode, ExportPhase, OutputContext } from '../domain/enums';

const PRINTABLE_FORMATS = ['pdf', 'png', 'jpg', 'jpeg', 'tiff'];

@Injectable()
export class ExportFacade implements IExportFacade {

  constructor(
    private readonly exportState: ExportState,
    private readonly ipcGateway: ExportIpcGateway,
  ) {}

  get phase(): Signal<ExportPhase>           { return this.exportState.phase; }
  get outputContext(): Signal<OutputContext | null> { return this.exportState.outputContext; }
  get result(): Signal<ExportResult | null>  { return this.exportState.result; }
  get progress(): Signal<number>             { return this.exportState.progress; }
  get error(): Signal<ExportError | null>    { return this.exportState.error; }
  get loading(): Signal<boolean>             { return this.exportState.loading; }
  get queue(): Signal<DownloadQueueItem[]>   { return this.exportState.queue; }

  // UC-19 — export singolo
  async exportFile(fileId: number): Promise<void> {
    this.exportState.setProcessing(OutputContext.SINGLE_EXPORT);
    try {
      const result = await this.ipcGateway.exportFile(fileId);

      if (result.canceled) {
        this.exportState.reset();
        return;
      }
      if (!result.success) {
        throw new Error(result.errorMessage ?? result.errorCode ?? 'Export fallito');
      }
      this.exportState.setSuccess(
        new ExportResult(OutputContext.SINGLE_EXPORT, 1, 1, 0, '')
      );
    } catch (err) {
      this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, err, 'exportFile');
    }
  }

  // UC-20 — export multiplo
  async exportFiles(fileIds: number[]): Promise<void> {
    this.exportState.setProcessing(OutputContext.MULTI_EXPORT);

    // Costruisce la coda ottimisticamente con i DTO per mostrare i nomi
    // I DTO servono solo alla UI per visualizzare lo stato — la logica è nel UC
    const dtos = await Promise.all(fileIds.map(id => this.ipcGateway.getFileDto(id)));
    const queue: DownloadQueueItem[] = dtos.reduce<DownloadQueueItem[]>((acc, dto, i) => {
      if (dto) acc.push({ fileId: fileIds[i], filename: dto.filename, status: 'pending' });
      return acc;
    }, []);

    if (queue.length === 0) {
      this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, new Error('Nessun file valido'), 'exportFiles');
      return;
    }

    this.exportState.initQueue(queue);

    // Progress: aggiorna la coda UI man mano che arrivano gli eventi
    const unsubscribe = this.ipcGateway.onExportProgress(({ current, total }) => {
      this.exportState.setProgress((current / total) * 100);
    });

    try {
      const { canceled, results } = await this.ipcGateway.exportFiles(fileIds);
      unsubscribe();

      if (canceled) {
        this.exportState.reset();
        return;
      }

      // Aggiorna lo stato visuale della coda in base ai risultati
      for (const r of results) {
        this.exportState.updateQueueItem(r.fileId, {
          status: r.success ? 'done' : 'error',
          error: r.error,
        });
      }

      const successCount = results.filter(r => r.success).length;
      const errors = results
        .filter(r => !r.success)
        .map(r => ({
          nodeId: String(r.fileId),
          nodeName: queue.find(q => q.fileId === r.fileId)?.filename ?? String(r.fileId),
          reason: r.error ?? 'Errore sconosciuto',
        }));

      this.exportState.setSuccess(
        new ExportResult(OutputContext.MULTI_EXPORT, queue.length, successCount, errors.length, '', errors)
      );
    } catch (err) {
      unsubscribe();
      this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, err, 'exportFiles');
    }
  }

  // UC-22 — stampa singolo
  async printDocument(fileId: number): Promise<void> {
    this.exportState.setProcessing(OutputContext.SINGLE_PRINT);
    try {
      const dto = await this.ipcGateway.getFileDto(fileId);
      if (!dto) throw new Error('File non trovato');

      if (!this.checkPrintable(dto.filename)) {
        this.exportState.setUnavailable(new ExportError(
          ExportErrorCode.PRINT_UNAVAILABLE, 'VALIDATION' as any, 'printDocument',
          `Formato non supportato: ${dto.filename}`, false,
        ));
        return;
      }
      console.log(`Iniziando stampa SINGOLA file ${dto.filename} (id: ${fileId})`);
      const result = await this.ipcGateway.printFile(fileId);
      if (!result.success) throw new Error(result.error ?? 'Stampa fallita');

      this.exportState.setSuccess(
        new ExportResult(OutputContext.SINGLE_PRINT, 1, 1, 0, '')
      );
    } catch (err) {
      this.handleError(ExportErrorCode.PRINT_FAILED, err, 'printDocument');
    }
  }

  // UC-23 — stampa multipla
  async printDocuments(fileIds: number[]): Promise<void> {
    this.exportState.setProcessing(OutputContext.MULTI_PRINT);
    try {
      const dtos = await Promise.all(fileIds.map(id => this.ipcGateway.getFileDto(id)));
      const printableIds = fileIds.filter((_, i) => {
        const dto = dtos[i];
        return !!dto && this.checkPrintable(dto.filename);
      });
      console.log(`Iniziando stampa MULTIPLA file ${dtos.map(dto => dto?.filename).filter((v): v is string => !!v).join(', ')} (ids: ${printableIds.join(', ')})`);

      if (printableIds.length === 0) {
        this.exportState.setUnavailable(new ExportError(
          ExportErrorCode.PRINT_UNAVAILABLE, 'VALIDATION' as any, 'printDocuments',
          'Nessun file supportato per la stampa', false,
        ));
        return;
      }

      const unsubscribe = this.ipcGateway.onPrintProgress(({ current, total }) => {
        this.exportState.setProgress((current / total) * 100);
      });

      const { canceled, results } = await this.ipcGateway.printFiles(printableIds);
      unsubscribe();

      if (canceled) {
        this.exportState.reset();
        return;
      }

      const errors = results
        .filter(r => !r.success)
        .map(r => ({
          nodeId: String(r.fileId),
          nodeName: String(r.fileId),
          reason: r.error ?? 'Errore sconosciuto',
        }));

      this.exportState.setSuccess(new ExportResult(
        OutputContext.MULTI_PRINT, printableIds.length,
        results.filter(r => r.success).length, errors.length, '', errors,
      ));
    } catch (err) {
      this.handleError(ExportErrorCode.PRINT_FAILED, err, 'printDocuments');
    }
  }

  reset(): void { this.exportState.reset(); }

  private checkPrintable(filename: string): boolean {
    return PRINTABLE_FORMATS.some(ext => filename.toLowerCase().endsWith(`.${ext}`));
  }

  private handleError(code: ExportErrorCode, err: unknown, context: string): void {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    this.exportState.setError(new ExportError(code, 'IPC' as any, context, message, true));
  }
}