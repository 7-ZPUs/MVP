import { Injectable, Signal } from '@angular/core';
import { ExportResult as IpcResult } from '../../../../../../shared/domain/ExportResult';
import { IExportFacade } from '../contracts/i-export-facade';
import { ExportIpcGateway } from '../infrastructure/export-ipc-gateway.service';
import { ExportState } from '../domain/export.state';
import { DownloadQueueItem, ExportError, ExportItemError, ExportResult } from '../domain/models';
import { ExportErrorCode, ExportPhase, OutputContext } from '../domain/enums';
import { FileDTO } from '../domain/dtos';

const PRINTABLE_FORMATS = ['pdf', 'png', 'jpg', 'jpeg', 'tiff'];

@Injectable()
export class ExportFacade implements IExportFacade {

    constructor(
        private readonly exportState: ExportState,
        private readonly ipcGateway: ExportIpcGateway,
    ) { }

    get phase(): Signal<ExportPhase> { return this.exportState.phase; }
    get outputContext(): Signal<OutputContext | null> { return this.exportState.outputContext; }
    get result(): Signal<ExportResult | null> { return this.exportState.result; }
    get progress(): Signal<number> { return this.exportState.progress; }
    get error(): Signal<ExportError | null> { return this.exportState.error; }
    get loading(): Signal<boolean> { return this.exportState.loading; }
    get queue(): Signal<DownloadQueueItem[]> { return this.exportState.queue; }

    // ------------------------------------------------------------------
    // UC-19 — export singolo file
    // ------------------------------------------------------------------
    async exportFile(fileId: number): Promise<void> {
        this.exportState.setProcessing(OutputContext.SINGLE_EXPORT);
        try {
            const dto = await this.ipcGateway.getFileDto(fileId);
            if (!dto) throw new Error(`File con id ${fileId} non trovato`);

            const dialog = await this.ipcGateway.openSaveDialog(dto.filename);
            if (dialog.canceled || !dialog.filePath) {
                this.exportState.reset();
                return;
            }

            const ipcResult: IpcResult = await this.ipcGateway.exportFile(fileId, dialog.filePath);
            if (!ipcResult.success) {
                throw new Error(ipcResult.errorMessage ?? ipcResult.errorCode ?? 'Export fallito');
            }

            this.exportState.setSuccess(
                new ExportResult(OutputContext.SINGLE_EXPORT, 1, 1, 0, dialog.filePath)
            );
        } catch (err) {
            this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, err, 'exportFile');
        }
    }

    // ------------------------------------------------------------------
    // UC-20 — export multiplo con coda sequenziale
    // ------------------------------------------------------------------
    async exportFiles(fileIds: number[]): Promise<void> {
        this.exportState.setProcessing(OutputContext.MULTI_EXPORT);
        try {
            // 1. Recupera tutti i DTO per avere i filename
            const dtos = await Promise.all(
                fileIds.map(id => this.ipcGateway.getFileDto(id))
            );

            // 2. Filtra i null e costruisce la coda
            const queue: DownloadQueueItem[] = dtos
                .reduce<DownloadQueueItem[]>((acc, dto, i) => {
                    if (dto) {
                        acc.push({ fileId: fileIds[i], filename: dto.filename, status: 'pending' });
                    }
                    return acc;
                }, []);
            if (queue.length === 0) throw new Error('Nessun file valido trovato');

            this.exportState.initQueue(queue);

            // 3. Un solo dialog per la cartella di destinazione
            const dialog = await this.ipcGateway.openFolderDialog();
            if (dialog.canceled || !dialog.folderPath) {
                this.exportState.reset();
                return;
            }

            // 4. Scarica in sequenza
            let successCount = 0;
            const errors: ExportItemError[] = [];

            for (let i = 0; i < queue.length; i++) {
                const item = queue[i];
                this.exportState.updateQueueItem(item.fileId, { status: 'downloading' });

                const filename = item.filename.split('/').pop() ?? item.filename;
                const destPath = `${dialog.folderPath}/${filename}`;
                const ipcResult: IpcResult = await this.ipcGateway.exportFile(item.fileId, destPath);

                if (ipcResult.success) {
                    successCount++;
                    this.exportState.updateQueueItem(item.fileId, { status: 'done' });
                } else {
                    const reason = ipcResult.errorMessage ?? ipcResult.errorCode ?? 'Errore sconosciuto';
                    errors.push({ nodeId: String(item.fileId), nodeName: item.filename, reason });
                    this.exportState.updateQueueItem(item.fileId, { status: 'error', error: reason });
                }

                this.exportState.setProgress(((i + 1) / queue.length) * 100);
            }

            this.exportState.setSuccess(
                new ExportResult(
                    OutputContext.MULTI_EXPORT,
                    queue.length,
                    successCount,
                    errors.length,
                    dialog.folderPath,
                    errors,
                )
            );
        } catch (err) {
            this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, err, 'exportFiles');
        }
    }

    // UC-22 — stampa singolo file
    async printDocument(fileId: number): Promise<void> {
        this.exportState.setProcessing(OutputContext.SINGLE_PRINT);
        try {
            // la validazione del formato la facciamo ancora qui per UX immediata
            const dto = await this.ipcGateway.getFileDto(fileId);
            if (!dto) throw new Error('File non trovato');

            if (!this.checkPrintable(dto.filename)) {
                this.exportState.setUnavailable(new ExportError(
                    ExportErrorCode.PRINT_UNAVAILABLE,
                    'VALIDATION' as any,
                    'printDocument',
                    `Formato non supportato: ${dto.filename}`,
                    false,
                ));
                return;
            }

            // passa solo fileId, il path lo risolve PrintFileUC nel main process
            const result = await this.ipcGateway.printFile(fileId);
            if (!result.success) throw new Error(result.error ?? 'Stampa fallita');

            this.exportState.setSuccess(
                new ExportResult(OutputContext.SINGLE_PRINT, 1, 1, 0, '')
            );
        } catch (err) {
            this.handleError(ExportErrorCode.PRINT_FAILED, err, 'printDocument');
        }
    }

    async printDocuments(fileIds: number[]): Promise<void> {
        this.exportState.setProcessing(OutputContext.MULTI_PRINT);
        try {
            // valida i formati prima di inviare al main process
            const dtos = await Promise.all(
                fileIds.map(id => this.ipcGateway.getFileDto(id))
            );

            const printableIds = fileIds.filter((_, i) => {
                const dto = dtos[i];
                return !!dto && this.checkPrintable(dto.filename);
            });

            if (printableIds.length === 0) {
                this.exportState.setUnavailable(new ExportError(
                    ExportErrorCode.PRINT_UNAVAILABLE,
                    'VALIDATION' as any,
                    'printDocuments',
                    'Nessun file supportato per la stampa',
                    false,
                ));
                return;
            }

            const unsubscribe = this.ipcGateway.onPrintProgress(({ current, total }) => {
                this.exportState.setProgress((current / total) * 100);
            });

            // passa fileIds, non path
            const { canceled, results } = await this.ipcGateway.printFiles(printableIds);

            unsubscribe();

            if (canceled) {
                this.exportState.reset();
                return;
            }

            const errors: ExportItemError[] = results
                .filter(r => !r.success)
                .map(r => ({
                    nodeId: String(r.fileId),
                    nodeName: String(r.fileId),
                    reason: r.error ?? 'Errore sconosciuto',
                }));

            this.exportState.setSuccess(new ExportResult(
                OutputContext.MULTI_PRINT,
                printableIds.length,
                results.filter(r => r.success).length,
                errors.length,
                '',
                errors,
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