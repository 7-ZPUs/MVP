import { Component, inject, input, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Iniezione dei Token separati come da C4
import { AGGREGATE_FACADE_TOKEN } from '../../../../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../../../../document/contracts/IDocumentFacade';

// Importiamo la UI
import { MetadataPanelComponent } from '../../dumb/metadata-panel/metadata-panel.component';
import { ErrorDialogComponent } from '../../../../../shared/components/error-dialog/error-dialog.component'; // Dal C4
// Importa i componenti di destra (la Toolbar, il Viewer, l'Index)
import { DocumentToolbarComponent } from '../../dumb/document-toolbar/document-toolbar.component';
import { DocumentActionsComponent } from '../document-actions/document-actions.component';
import { DocumentViewerComponent } from '../../../../document/components/document-viewer/document-viewer.component';
import { DocumentIndexComponent } from '../../../../aggregate/components/document-index/document-index.component';
import { buildDetailRoute } from '../../../../navigation/domain/navigation-routing';

@Component({
  selector: 'app-item-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MetadataPanelComponent,
    ErrorDialogComponent,
    DocumentToolbarComponent,
    DocumentActionsComponent,
    DocumentViewerComponent,
    DocumentIndexComponent,
  ],
  template: `
    <div class="page-layout">
      @if (!isLoading() && !currentError()) {
        <app-document-actions [itemId]="itemId()" [itemType]="itemType()"></app-document-actions>

        @if (itemType() === 'DOCUMENT') {
          <app-document-toolbar
            [titolo]="pageTitle()"
            [formato]="documentState().detail?.mimeType || ''"
            [zoomLevel]="zoomLevel()"
            [parentAggregateId]="parentAggregateId()"
            [isPreviewVisible]="isPreviewVisible()"
            (zoomIn)="zoomLevel.set(zoomLevel() + 10)"
            (zoomOut)="zoomLevel.set(Math.max(10, zoomLevel() - 10))"
            (resetZoom)="zoomLevel.set(100)"
            (navigateBack)="onNavigateBack($event)"
            (closePreview)="onClosePreview()"
            (openPreview)="onOpenPreview()"
          >
          </app-document-toolbar>
        }
      }

      @if (isLoading()) {
        <div class="spinner-overlay">
          <p>Caricamento in corso...</p>
        </div>
      }

      @if (currentError()) {
        <app-error-dialog [error]="currentError()!" (retry)="retryLoad()"> </app-error-dialog>
      }

      @if (!isLoading() && !currentError()) {
        <div class="content-layout">
          @if (itemType() === 'DOCUMENT' && documentState().detail; as doc) {
            <aside
              class="sidebar"
              [style.flex-basis]="isPreviewVisible() ? '350px' : '100%'"
              [style.max-width]="isPreviewVisible() ? '350px' : '100%'"
            >
              <app-metadata-panel [itemType]="'DOCUMENT'" [documentData]="doc"></app-metadata-panel>
            </aside>

            @if (isPreviewVisible()) {
              <main class="main-content">
                <app-document-viewer
                  [documentId]="doc.documentId"
                  [mimeType]="doc.mimeType"
                ></app-document-viewer>
              </main>
            }
          }

          @if (itemType() === 'AGGREGATE' && aggregateState().detail; as agg) {
            <aside class="sidebar">
              <app-metadata-panel
                [itemType]="'AGGREGATE'"
                [aggregateData]="agg"
              ></app-metadata-panel>
            </aside>

            <main class="main-content">
              <app-document-index
                [items]="agg.indiceDocumenti"
                (documentSelected)="onDocumentSelected($event)"
              ></app-document-index>
            </main>
          }
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
        width: 1700px;
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
      .content-layout {
        display: flex;
        flex: 1;
        gap: 20px;
        overflow: hidden; /* Evita che sfondi oltre lo schermo */
        padding: 0 20px 20px 20px; /* Un po' di padding se necessario */
      }

      .sidebar {
        width: 350px;
        flex-shrink: 0;
        overflow-y: auto; /* Se i metadati sono tanti, scorrono qui */
      }

      .main-content {
        flex-grow: 1;
        background-color: #f5f5f5; /* Sfondo grigetto tipico dei visualizzatori PDF */
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      app-document-viewer,
      app-document-index,
      app-metadata-panel {
        display: block;
        flex: 1;
        height: 100%;
        width: 100%;
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
  private readonly router = inject(Router);

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
      return `Fascicolo ${this.aggregateState().detail!.tipologiaFascicolo}`;
    }
    if (this.itemType() === 'DOCUMENT' && this.documentState().detail) {
      return this.documentState().detail!.fileName;
    }
    return '';
  });

  parentAggregateId = computed(() => {
    if (this.itemType() !== 'DOCUMENT') {
      return null;
    }

    return this.documentState().detail?.idAggregazione ?? null;
  });

  constructor() {
    effect(() => {
      // Quando cambia l'URL o l'ID, ricarica i dati con il Facade corretto
      this.loadData();
    });
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

  // Aggiunto per soddisfare gli input/output richiesti da DocumentToolbarComponent e DocumentIndexComponent
  Math = Math;
  zoomLevel = signal(100);

  // Controlla se la preview del documento (app-document-viewer) è visibile
  isPreviewVisible = signal(true);

  onNavigateBack(aggregateId: string) {
    if (!aggregateId) {
      return;
    }

    void this.router.navigate(buildDetailRoute('AGGREGATE', aggregateId));
  }

  onDocumentSelected(docId: string) {
    void this.router.navigate(buildDetailRoute('DOCUMENT', docId));
    // Resetta la visibilità della preview quando si apre un nuovo documento
    this.isPreviewVisible.set(true);
  }

  onClosePreview() {
    // Invece di navigare, nascondiamo la preview e lasciamo espandere i metadati
    this.isPreviewVisible.set(false);
  }

  onOpenPreview() {
    // Mostra nuovamente la preview
    this.isPreviewVisible.set(true);
  }
}
