import { Signal }      from '@angular/core';
import { ExportPhase, OutputContext } from '../domain/enums';
import { ExportResult, ExportError } from '../domain/models'; // ← solo modello UI, non shared
import { DipTreeNode } from '../../import/domain/models';

export interface IExportFacade {
    phase:         Signal<ExportPhase>;
    outputContext: Signal<OutputContext | null>;
    result:        Signal<ExportResult | null>;  // ← ExportResult da domain/models
    progress:      Signal<number>;
    error:         Signal<ExportError | null>;
    loading:       Signal<boolean>;

    exportFile(node: DipTreeNode):      Promise<void>;  // UC-19
    exportFiles(nodes: DipTreeNode[]):  Promise<void>;  // UC-20
    printDocument(node: DipTreeNode):   Promise<void>;  // UC-22
    reset():                            void;
}