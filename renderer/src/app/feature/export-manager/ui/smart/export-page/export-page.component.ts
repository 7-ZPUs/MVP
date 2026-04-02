import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Imports dai servizi (Facade)
import { ExportFacade } from '../../../services/export.facade';
import { ImportFacade } from '../../../../import/services/import.facade';

// Imports dal dominio (Enums e Models)
import { ExportPhase, OutputContext } from '../../../domain/enums';
import { ExportResult, ExportError } from '../../../domain/models';
import { DipTreeNode } from '../../../../import/domain/models';

// Imports dei componenti Dumb (quelli che abbiamo testato prima)
import { DocumentActionsComponent } from '../../dumb/document-actions/document-actions.component';
import { ExportResultComponent } from '../../dumb/export-result/export-result.component';
import { ExportProgressComponent } from '../../dumb/export-progress/export-progress.component';

@Component({
  selector: 'app-export-page',
  standalone: true,
  imports: [
    CommonModule, 
    DocumentActionsComponent, 
    ExportResultComponent, 
    ExportProgressComponent
  ],
  templateUrl: './export-page.component.html',
  styleUrls: ['./export-page.component.scss']
})
export class ExportPageComponent {

  // Esponiamo l'enum al template HTML
  protected readonly ExportPhase = ExportPhase;

  // Definiamo i Signals che leggono lo stato dalla Facade
  readonly phase: Signal<ExportPhase>;
  readonly outputContext: Signal<OutputContext | null>;
  readonly result: Signal<ExportResult | null>;
  readonly progress: Signal<number>;
  readonly error: Signal<ExportError | null>;
  readonly loading: Signal<boolean>;
  readonly selectedDocument: Signal<DipTreeNode | null>;

  // Proprietà locale per il report
  reportId: string | null = null;

  constructor(
    private readonly exportFacade: ExportFacade,
    private readonly importFacade: ImportFacade,
  ) {
    // Colleghiamo i Signals del componente a quelli delle Facade
    this.phase         = this.exportFacade.phase;
    this.outputContext = this.exportFacade.outputContext;
    this.result        = this.exportFacade.result;
    this.progress      = this.exportFacade.progress;
    this.error         = this.exportFacade.error;
    this.loading       = this.exportFacade.loading;
    this.selectedDocument = this.importFacade.selectedDocument;
  }

  /** * Converte il selectedDocument (singolo) in un array 
   * per passarlo correttamente al DocumentActionsComponent 
   */
  selectedAsArray(): DipTreeNode[] {
    const doc = this.selectedDocument();
    return doc ? [doc] : [];
  }

  /**
   * Verifica se l'operazione corrente riguarda più documenti
   * (serve per decidere se mostrare la barra di progresso)
   */
  isMulti(): boolean {
    const context = this.outputContext();
    return context === OutputContext.MULTI_EXPORT || context === OutputContext.MULTI_PRINT;
  }

  /** Gestisce il click sul tasto Salva */
  onExport(nodes: DipTreeNode[]): void {
    if (nodes.length === 1) {
      this.exportFacade.exportDocument(nodes[0]);
    } else if (nodes.length > 1) {
      this.exportFacade.exportDocuments(nodes);
    }
  }

  /** Gestisce il click sul tasto Stampa */
  onPrint(nodes: DipTreeNode[]): void {
    if (nodes.length === 1) {
      this.exportFacade.printDocument(nodes[0]);
    } else if (nodes.length > 1) {
      this.exportFacade.printDocuments(nodes);
    }
  }

  /** Gestisce l'esportazione del report PDF */
  onExportReport(reportId: string): void {
    this.exportFacade.exportReportPdf(reportId);
  }

  /** Resetta lo stato in caso di errore o per nuova operazione */
  onRetry(): void {
    this.exportFacade.reset();
  }
}