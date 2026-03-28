import { Component, inject, input, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

// Iniezione dei Token separati come da C4
import { AGGREGATE_FACADE_TOKEN } from '../../../../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../../../../document/contracts/IDocumentFacade';

// Importiamo la UI
import { MetadataPanelComponent } from '../../dumb/metadata-panel/metadata-panel.component';
import { ErrorDialogComponent } from '../../../../../shared/components/error-dialog/error-dialog.component'; // Dal C4
// Importa i componenti di destra (la Toolbar, il Viewer, l'Index)
import { DocumentToolbarComponent } from '../../dumb/document-toolbar/document-toolbar.component';
import { DocumentViewerComponent } from '../../../../document/components/document-viewer/document-viewer.component';
import { DocumentIndexComponent } from '../../../../aggregate/components/document-index/document-index.component';

@Component({
  selector: 'app-item-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MetadataPanelComponent,
    ErrorDialogComponent,
    // DocumentToolbarComponent, DocumentViewerComponent, DocumentIndexComponent
  ],
  template: `
    <div class="page-layout">
      @if (currentError(); as err) {
        <app-error-dialog [error]="err" (onRetry)="retryLoad()"></app-error-dialog>
      }

      @if (isLoading()) {
        <div class="spinner-overlay">
          <div class="spinner"></div>
          <p>Recupero dati in corso...</p>
        </div>
      }

      @if (!isLoading() && !currentError()) {
        <div class="split-screen-content">
          <aside class="left-panel">
            <app-metadata-panel
              [itemType]="itemType()"
              [aggregateData]="aggregateState().detail"
              [documentData]="documentState().detail"
            >
            </app-metadata-panel>
          </aside>

          <main class="right-panel">
            <div class="viewer-container">
              @if (itemType() === 'AGGREGATE' && aggregateState().detail) {
              } @else if (itemType() === 'DOCUMENT' && documentState().detail) {}
            </div>
          </main>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #f1f5f9;
      }
      .split-screen-content {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .left-panel {
        width: 400px;
        flex-shrink: 0;
        background: white;
        z-index: 10;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
      }
      .right-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .viewer-container {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }
      .spinner-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .spinner {
        border: 4px solid #e2e8f0;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ItemDetailPageComponent {
  // 1. INIEZIONE TRAMITE TOKEN (Dependency Inversion)
  private readonly aggregateFacade = inject(AGGREGATE_FACADE_TOKEN);
  private readonly documentFacade = inject(DOCUMENT_FACADE_TOKEN);

  // 2. INPUT DALLA ROTTA (es. /detail/AGGREGATE/123)
  itemId = input.required<string>();
  itemType = input.required<'AGGREGATE' | 'DOCUMENT'>();

  // 3. COLLEGAMENTO AI FACADE
  aggregateState = this.aggregateFacade.getState();
  documentState = this.documentFacade.getState();

  // 4. COMPUTED SIGNALS (Unificano lo stato in base alla rotta attuale)
  isLoading = computed(() => {
    return this.itemType() === 'AGGREGATE'
      ? this.aggregateState().loading
      : this.documentState().loading;
  });

  currentError = computed(() => {
    return this.itemType() === 'AGGREGATE'
      ? this.aggregateState().error
      : this.documentState().error;
  });

  pageTitle = computed(() => {
    if (this.itemType() === 'AGGREGATE' && this.aggregateState().detail) {
      return `Fascicolo ${this.aggregateState().detail!.metadata.progressivo}`;
    }
    if (this.itemType() === 'DOCUMENT' && this.documentState().detail) {
      return this.documentState().detail!.fileName;
    }
    return '';
  });

  constructor() {
    effect(
      () => {
        // Quando cambia l'URL o l'ID, ricarica i dati con il Facade corretto
        this.loadData();
      },
      { allowSignalWrites: true },
    );
  }

  private loadData() {
    if (this.itemType() === 'AGGREGATE') {
      this.aggregateFacade.loadAggregate(this.itemId());
    } else {
      this.documentFacade.loadDocument(this.itemId());
    }
  }

  retryLoad() {
    this.loadData(); // Invocato dall'ErrorDialogComponent
  }
}
