/**
 * @component ExportPageComponent
 * @selector app-export-page
 *
 * Componente smart che orchestra tutta la logica di export e stampa.
 * Legge i documenti selezionati tramite ImportFacade e delega
 * le operazioni a ExportFacade, che comunica col backend via IPC.
 *
 * ─────────────────────────────────────────────────────────────────
 * UTILIZZO STAND-ALONE
 * ─────────────────────────────────────────────────────────────────
 * Il componente funziona autonomamente se l'ImportFacade ha già
 * un documento selezionato. Non serve passare nulla:
 *
 *   <app-export-page />
 *
 * Il componente padre deve solo assicurarsi che prima del render
 * venga chiamato importFacade.selectDocument(node), ad esempio
 * in risposta al click su un nodo dell'albero:
 *
 *   // parent.component.ts
 *   onNodeClick(node: DipTreeNode): void {
 *     this.importFacade.selectDocument(node);
 *   }
 *
 * ─────────────────────────────────────────────────────────────────
 * UTILIZZO CON SELEZIONE MULTIPLA
 * ─────────────────────────────────────────────────────────────────
 * Se il padre gestisce una selezione multipla, deve chiamare
 * i metodi appositi dell'ImportFacade per ogni nodo:
 *
 *   // parent.component.ts
 *   onCheckbox(node: DipTreeNode, checked: boolean): void {
 *     if (checked) this.importFacade.selectDocument(node);
 *     else         this.importFacade.deselectDocument(node);
 *   }
 *
 *   // parent.component.html
 *   <input type="checkbox" (change)="onCheckbox(node, $event.target.checked)" />
 *   <app-export-page />
 *
 * I bottoni Salva e Stampa si abilitano automaticamente non appena
 * almeno un documento è presente in ImportFacade.selectedDocuments.
 *
 * ─────────────────────────────────────────────────────────────────
 * FLUSSO DOWNLOAD (UC-19 singolo, UC-20 multiplo)
 * ─────────────────────────────────────────────────────────────────
 *   1. Utente clicca Salva
 *   2. Si apre il dialog nativo dell'OS per scegliere il path
 *   3. Il file viene letto dal package e scritto su disco via IPC
 *   4. Il risultato aggiorna l'ExportState e viene mostrato in UI
 *
 * ─────────────────────────────────────────────────────────────────
 * FLUSSO STAMPA (UC-22)
 * ─────────────────────────────────────────────────────────────────
 *   1. Utente clicca Stampa
 *   2. Viene verificato che il formato sia stampabile
 *      (pdf, png, jpg, jpeg, tiff)
 *   3. Il path completo del file viene recuperato via IPC
 *      usando BROWSE_GET_FILE_BY_ID
 *   4. Il file viene aperto con shell.openPath — l'OS delega
 *      all'applicazione predefinita (es. Adobe Reader per PDF)
 *   5. L'utente stampa dall'applicazione nativa
 *
 * ─────────────────────────────────────────────────────────────────
 * DIPENDENZE RICHIESTE NEL MODULO PADRE
 * ─────────────────────────────────────────────────────────────────
 *   - ImportFacade  (providedIn: 'root' — nessuna registrazione manuale)
 *   - ExportFacade  (providedIn: 'root' — nessuna registrazione manuale)
 *
 * Entrambe le facade sono singleton: lo stato è condiviso tra tutti
 * i componenti che le iniettano. Chiamare importFacade.clearSelection()
 * nel padre quando si cambia contesto per evitare selezioni residue.
 */
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
    private readonly ExportFacade: ExportFacade,
    private readonly importFacade: ImportFacade,
  ) {
    // Colleghiamo i Signals del componente a quelli delle Facade
    this.phase = this.ExportFacade.phase;
    this.outputContext = this.ExportFacade.outputContext;
    this.result = this.ExportFacade.result;
    this.progress = this.ExportFacade.progress;
    this.error = this.ExportFacade.error;
    this.loading = this.ExportFacade.loading;
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
      this.ExportFacade.exportFile(nodes[0]);
    } else if (nodes.length > 1) {
      this.ExportFacade.exportFiles(nodes); 
    }
  }

  /** Gestisce il click sul tasto Stampa */
  onPrint(nodes: DipTreeNode[]): void {
    if (nodes.length === 1) {
      this.ExportFacade.printDocument(nodes[0]);
    }
    // nodes.length > 1 rimosso: printDocuments non esiste nel facade
  }

  onExportReport(_reportId: string): void {
    // non implementato: exportReportPdf non è disponibile nel facade
  }

  /** Resetta lo stato in caso di errore o per nuova operazione */
  onRetry(): void {
    this.ExportFacade.reset();
  }
}