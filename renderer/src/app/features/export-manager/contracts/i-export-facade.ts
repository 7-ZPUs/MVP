import { Signal }      from '@angular/core';
import { ExportPhase, OutputContext } from '../domain/enums';
import { ExportResult, ExportError } from '../domain/models'; // ← solo modello UI, non shared

export interface IExportFacade {
    phase:         Signal<ExportPhase>;
    outputContext: Signal<OutputContext | null>;
    result:        Signal<ExportResult | null>;  // ← ExportResult da domain/models
    progress:      Signal<number>;
    error:         Signal<ExportError | null>;
    loading:       Signal<boolean>;

    exportFile(fileId: number): Promise<void> ;  // UC-19
    exportFiles(fileIds: number[]):  Promise<void>;  // UC-20
    printDocument(fileId: number    ):   Promise<void>;  // UC-22
    reset():                            void;
}