import { Component, Signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { ExportFacade }              from '../../services/export.facade';
import { ImportFacade }              from '../../../import/services/import.facade';
import { ExportPhase, OutputContext } from '../../domain/enums';
import { ExportResult, ExportError } from '../../domain/models';
import { DipTreeNode }               from '../../../import/domain/models';
import { DocumentActionsComponent }  from '../dumb/document-actions.component';
import { ExportResultComponent }     from '../dumb/export-result.component';
import { ExportProgressComponent }   from '../dumb/export-progress.component';
 
@Component({
  selector:   'app-export-page',
  standalone: true,
  imports:    [CommonModule, DocumentActionsComponent, ExportResultComponent, ExportProgressComponent],
  template: `
    <div class="export-page">
 
      <!-- Azioni disponibili sui documenti selezionati -->
      <app-document-actions
        [selectedDocuments]="selectedAsArray()"
        [reportId]="reportId"
        (exportClicked)="onExport($event)"
        (printClicked)="onPrint($event)"
        (exportReportClicked)="onExportReport($event)"
      />
 
      <!-- Avanzamento operazione multipla — UC-20 UC-23 -->
      @if (loading() && isMulti()) {
        <app-export-progress
          [progress]="progress()"
          [outputContext]="outputContext()"
        />
      }
 
      <!-- Esito operazione — UC-21 UC-24 UC-25 UC-37 -->
      @if (phase() !== ExportPhase.IDLE && phase() !== ExportPhase.PROCESSING) {
        <app-export-result
          [phase]="phase()"
          [result]="result()"
          [error]="error()"
          (retry)="onRetry()"
        />
      }
 
    </div>
  `,
})
export class ExportPageComponent {
 
  protected readonly ExportPhase = ExportPhase;
 
  readonly phase:         Signal<ExportPhase>;
  readonly outputContext: Signal<OutputContext | null>;
  readonly result:        Signal<ExportResult | null>;
  readonly progress:      Signal<number>;
  readonly error:         Signal<ExportError | null>;
  readonly loading:       Signal<boolean>;
  readonly selectedDocument: Signal<DipTreeNode | null>;
 
  reportId: string | null = null;
 
  constructor(
    private readonly exportFacade: ExportFacade,
    private readonly importFacade: ImportFacade,
  ) {
    this.phase         = this.exportFacade.phase;
    this.outputContext = this.exportFacade.outputContext;
    this.result        = this.exportFacade.result;
    this.progress      = this.exportFacade.progress;
    this.error         = this.exportFacade.error;
    this.loading       = this.exportFacade.loading;
    this.selectedDocument = this.importFacade.selectedDocument;
  }
 
  /** Converte selectedDocument (singolo) in array per DocumentActionsComponent */
  selectedAsArray(): DipTreeNode[] {
    const doc = this.selectedDocument();
    return doc ? [doc] : [];
  }
 
  isMulti(): boolean {
    return this.outputContext() === OutputContext.MULTI_EXPORT
        || this.outputContext() === OutputContext.MULTI_PRINT;
  }
 
  onExport(nodes: DipTreeNode[]): void {
    if (nodes.length === 1) this.exportFacade.exportDocument(nodes[0]);
    else                    this.exportFacade.exportDocuments(nodes);
  }
 
  onPrint(nodes: DipTreeNode[]): void {
    if (nodes.length === 1) this.exportFacade.printDocument(nodes[0]);
    else                    this.exportFacade.printDocuments(nodes);
  }
 
  onExportReport(reportId: string): void {
    this.exportFacade.exportReportPdf(reportId);
  }
 
  onRetry(): void {
    this.exportFacade.reset();
  }
}