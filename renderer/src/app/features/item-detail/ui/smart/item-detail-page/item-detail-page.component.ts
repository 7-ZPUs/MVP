import { Component, inject, input, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Iniezione dei Token separati come da C4
import { AGGREGATE_FACADE_TOKEN } from '../../../../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../../../../document/contracts/IDocumentFacade';
import { NODE_FALLBACK_FACADE_TOKEN } from '../../../contracts/INodeFallbackFacade';
import { PROCESS_FACADE_TOKEN } from '../../../../process/contracts/IProcessFacade';
import {
  NodeFallbackItemType,
  NodeFallbackRelatedItem,
} from '../../../domain/node-fallback.models';

// Importiamo la UI
import { MetadataPanelComponent } from '../../dumb/metadata-panel/metadata-panel.component';
import { ErrorDialogComponent } from '../../../../../shared/components/error-dialog/error-dialog.component'; // Dal C4
// Importa i componenti di destra (la Toolbar, il Viewer, l'Index)
import { DocumentToolbarComponent } from '../../dumb/document-toolbar/document-toolbar.component';
import { DocumentActionsComponent } from '../document-actions/document-actions.component';
import { DocumentViewerComponent } from '../../../../document/components/document-viewer/document-viewer.component';
import { DocumentIndexComponent } from '../../../../aggregate/components/document-index/document-index.component';
import {
  buildDetailRoute,
  DetailRouteItemType,
  isRichDetailRouteItemType,
  RichDetailRouteItemType,
} from '../../../../navigation/domain/navigation-routing';
import { NodeFallbackPanelComponent } from '../../dumb/node-fallback-panel/node-fallback-panel.component';

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
    NodeFallbackPanelComponent,
  ],
  template: `
    <div class="page-layout">
      @if (!isLoading() && !currentError() && richItemType(); as richType) {
        <app-document-actions
          [itemId]="itemId()"
          [itemType]="richType"
          [initialVerificationStatus]="
            richType === 'DOCUMENT'
              ? documentState().detail?.integrityStatus
              : richType === 'PROCESS'
                ? processState().detail?.integrityStatus
              : aggregateState().detail?.processSummary?.integrityStatus
          "
        ></app-document-actions>

        @if (richType === 'DOCUMENT') {
          <app-document-toolbar
            [titolo]="pageTitle()"
            [formato]="documentState().detail?.mimeType || ''"
            [zoomLevel]="zoomLevel()"
            [isPreviewVisible]="isPreviewVisible()"
            (zoomIn)="zoomLevel.set(zoomLevel() + 10)"
            (zoomOut)="zoomLevel.set(Math.max(10, zoomLevel() - 10))"
            (resetZoom)="zoomLevel.set(100)"
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
              [style.max-width]="isPreviewVisible() ? '50vw' : '100%'"
            >
              <app-metadata-panel [itemType]="'DOCUMENT'" [documentData]="doc"></app-metadata-panel>
            </aside>

            @if (isPreviewVisible()) {
              <main class="main-content">
                <app-document-viewer
                  data-testid="document-viewer"
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

          @if (itemType() === 'PROCESS' && processState().detail; as process) {
            <aside class="sidebar process-sidebar">
              <app-metadata-panel
                [itemType]="'PROCESS'"
                [processData]="process"
              ></app-metadata-panel>
            </aside>

            <main class="main-content process-main-content">
              <app-document-index
                [items]="process.indiceDocumenti"
                (documentSelected)="onDocumentSelected($event)"
              ></app-document-index>
            </main>
          }

          @if (isFallbackRoute() && fallbackState().detail; as fallbackDetail) {
            <main class="fallback-content">
              <app-node-fallback-panel
                [detail]="fallbackDetail"
                (relatedItemSelected)="onFallbackRelatedSelected($event)"
              ></app-node-fallback-panel>
            </main>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './item-detail-page.component.scss',
})
export class ItemDetailPageComponent {
  // 1. INIEZIONE TRAMITE TOKEN (Dependency Inversion)
  private readonly aggregateFacade = inject(AGGREGATE_FACADE_TOKEN);
  private readonly processFacade = inject(PROCESS_FACADE_TOKEN);
  private readonly documentFacade = inject(DOCUMENT_FACADE_TOKEN);
  private readonly nodeFallbackFacade = inject(NODE_FALLBACK_FACADE_TOKEN);
  private readonly router = inject(Router);

  // 2. INPUT DALLA ROTTA (es. /detail/AGGREGATE/123)
  itemId = input.required<string>();
  itemType = input.required<DetailRouteItemType>();

  // 3. COLLEGAMENTO AI FACADE
  aggregateState = this.aggregateFacade.getState();
  processState = this.processFacade.getState();
  documentState = this.documentFacade.getState();
  fallbackState = this.nodeFallbackFacade.getState();

  richItemType = computed<RichDetailRouteItemType | null>(() => {
    const currentType = this.itemType();
    return isRichDetailRouteItemType(currentType) ? currentType : null;
  });

  isFallbackRoute = computed(() => !isRichDetailRouteItemType(this.itemType()));

  // 4. COMPUTED SIGNALS (Unificano lo stato in base alla rotta attuale)
  isLoading = computed(() => {
    const currentType = this.itemType();
    if (currentType === 'AGGREGATE') {
      return this.aggregateState().loading;
    }
    if (currentType === 'PROCESS') {
      return this.processState().loading;
    }
    if (currentType === 'DOCUMENT') {
      return this.documentState().loading;
    }
    return this.fallbackState().loading;
  });

  currentError = computed(() => {
    const currentType = this.itemType();
    if (currentType === 'AGGREGATE') {
      return this.aggregateState().error;
    }
    if (currentType === 'PROCESS') {
      return this.processState().error;
    }
    if (currentType === 'DOCUMENT') {
      return this.documentState().error;
    }
    return this.fallbackState().error;
  });

  pageTitle = computed(() => {
    if (this.itemType() === 'AGGREGATE' && this.aggregateState().detail) {
      return `Fascicolo ${this.aggregateState().detail!.tipologiaFascicolo}`;
    }
    if (this.itemType() === 'PROCESS' && this.processState().detail) {
      return this.processState().detail!.processUuid;
    }
    if (this.itemType() === 'DOCUMENT' && this.documentState().detail) {
      return this.documentState().detail!.fileName;
    }
    if (this.isFallbackRoute() && this.fallbackState().detail) {
      return this.fallbackState().detail!.title;
    }
    return '';
  });

  constructor() {
    effect(() => {
      // Quando cambia l'URL o l'ID, ricarica i dati con il Facade corretto
      this.loadData();
    });
  }

  private loadData() {
    const currentType = this.itemType();
    const currentId = this.itemId();
    if (currentType === 'AGGREGATE') {
      void this.aggregateFacade.loadAggregate(currentId);
      return;
    }
    if (currentType === 'PROCESS') {
      void this.processFacade.loadProcess(currentId);
      return;
    }
    if (currentType === 'DOCUMENT') {
      void this.documentFacade.loadDocument(currentId);
      return;
    }

    void this.nodeFallbackFacade.loadNode(currentType as NodeFallbackItemType, currentId);
  }

  retryLoad() {
    this.loadData(); // Invocato dall'ErrorDialogComponent
  }

  // Aggiunto per soddisfare gli input/output richiesti da DocumentToolbarComponent e DocumentIndexComponent
  Math = Math;
  zoomLevel = signal(100);

  // Controlla se la preview del documento (app-document-viewer) è visibile
  isPreviewVisible = signal(false);

  onDocumentSelected(docId: string) {
    void this.router.navigate(buildDetailRoute('DOCUMENT', docId));
    // Resetta la visibilità della preview quando si apre un nuovo documento
    this.isPreviewVisible.set(true);
  }

  onFallbackRelatedSelected(item: NodeFallbackRelatedItem): void {
    void this.router.navigate(buildDetailRoute(item.itemType, item.itemId));
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
