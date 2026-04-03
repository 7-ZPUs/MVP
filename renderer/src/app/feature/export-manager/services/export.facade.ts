import { Injectable, Signal }        from '@angular/core';
import { ExportResult as IpcResult } from '../../../../../../shared/domain/ExportResult'; // DTO IPC
import { IExportFacade }             from '../contracts/i-export-facade';
import { ExportIpcGateway }          from '../infrastructure/export-ipc-gateway.service';
import { ExportState }               from '../domain/export.state';
import { ExportError, ExportItemError, ExportResult } from '../domain/models'; // modello UI
import { ExportErrorCode, ExportPhase, OutputContext } from '../domain/enums';
import { DipTreeNode }               from '../../import/domain/models';

const PRINTABLE_FORMATS = ['pdf', 'png', 'jpg', 'jpeg', 'tiff'];

@Injectable({ providedIn: 'root' })
export class ExportFacade implements IExportFacade {

    constructor(
        private readonly exportState: ExportState,
        private readonly ipcGateway:  ExportIpcGateway,
    ) {}

    get phase():         Signal<ExportPhase>         { return this.exportState.phase; }
    get outputContext(): Signal<OutputContext | null> { return this.exportState.outputContext; }
    get result():        Signal<ExportResult | null> { return this.exportState.result; }
    get progress():      Signal<number>              { return this.exportState.progress; }
    get error():         Signal<ExportError | null>  { return this.exportState.error; }
    get loading():       Signal<boolean>             { return this.exportState.loading; }

    // ------------------------------------------------------------------
    // UC-19 — export singolo file
    // ------------------------------------------------------------------
    async exportFile(node: DipTreeNode): Promise<void> {
        this.exportState.setProcessing(OutputContext.SINGLE_EXPORT);
        try {
            const dialog = await this.ipcGateway.openSaveDialog(node.label);
            if (dialog.canceled || !dialog.filePath) {
                this.exportState.reset();
                return;
            }

            const ipcResult: IpcResult = await this.ipcGateway.exportFile(Number(node.id), dialog.filePath);

            if (!ipcResult.success) {
                throw new Error(ipcResult.errorMessage ?? ipcResult.errorCode ?? 'Export fallito');
            }

            // Costruisce il modello UI dal risultato IPC
            this.exportState.setSuccess(
                new ExportResult(OutputContext.SINGLE_EXPORT, 1, 1, 0, dialog.filePath)
            );
        } catch (err) {
            this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, err, 'exportFile');
        }
    }

    // ------------------------------------------------------------------
    // UC-20 — export multiplo file
    // ------------------------------------------------------------------
    async exportFiles(nodes: DipTreeNode[]): Promise<void> {
        this.exportState.setProcessing(OutputContext.MULTI_EXPORT);
        try {
            const dialog = await this.ipcGateway.openSaveDialog();
            if (dialog.canceled || !dialog.filePath) {
                this.exportState.reset();
                return;
            }

            let successCount = 0;
            const errors: ExportItemError[] = [];

            for (let i = 0; i < nodes.length; i++) {
                const ipcResult: IpcResult = await this.ipcGateway.exportFile(
                    Number(nodes[i].id),
                    dialog.filePath
                );

                if (ipcResult.success) {
                    successCount++;
                } else {
                    errors.push({
                        nodeId:   nodes[i].id,
                        nodeName: nodes[i].label,
                        reason:   ipcResult.errorMessage ?? ipcResult.errorCode ?? 'Errore sconosciuto',
                    });
                }

                this.exportState.setProgress(((i + 1) / nodes.length) * 100);
            }

            // Costruisce il modello UI con il riepilogo completo
            this.exportState.setSuccess(
                new ExportResult(
                    OutputContext.MULTI_EXPORT,
                    nodes.length,
                    successCount,
                    errors.length,
                    dialog.filePath,
                    errors
                )
            );
        } catch (err) {
            this.handleError(ExportErrorCode.EXPORT_WRITE_FAILED, err, 'exportFiles');
        }
    }

    // ------------------------------------------------------------------
    // UC-22 — stampa singolo documento (solo renderer, nessun IPC)
    // ------------------------------------------------------------------
    async printDocument(node: DipTreeNode): Promise<void> {
        if (!this.checkPrintable(node)) {
            this.exportState.setUnavailable(new ExportError(
                ExportErrorCode.PRINT_UNAVAILABLE,
                'VALIDATION' as any,
                'printDocument',
                `Formato non supportato per la stampa: ${node.label}`,
                false,
            ));
            return;
        }
        this.exportState.setProcessing(OutputContext.SINGLE_PRINT);
        try {
            await (window as any).electron.printCurrentPage();
            this.exportState.setSuccess(
                new ExportResult(OutputContext.SINGLE_PRINT, 1, 1, 0, '')
            );
        } catch (err) {
            this.handleError(ExportErrorCode.PRINT_FAILED, err, 'printDocument');
        }
    }

    reset(): void { this.exportState.reset(); }

    private checkPrintable(node: DipTreeNode): boolean {
        return PRINTABLE_FORMATS.some(ext => node.label.toLowerCase().endsWith(`.${ext}`));
    }

    private handleError(code: ExportErrorCode, err: unknown, context: string): void {
        const message = err instanceof Error ? err.message : 'Errore sconosciuto';
        this.exportState.setError(new ExportError(code, 'IPC' as any, context, message, true));
    }
}