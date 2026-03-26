import { Component, inject, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ITEM_DETAIL_FACADE_TOKEN, IItemDetailFacade } from '../../../contracts/IItemDetailFacade';

// Componenti Dumb
import { DocumentToolbarComponent } from '../../dumb/document-toolbar/document-toolbar.component';
import { PreviewPanelComponent } from '../../dumb/preview-panel/preview-panel.component';
import { MetadataPanelComponent } from '../../dumb/metadata-panel/metadata-panel.component';
import { DocumentIndexComponent } from '../../dumb/document-index/document-index.component';
import { DocumentActionsComponent } from '../document-actions/document-actions.component';

@Component({
  selector: 'app-item-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    DocumentToolbarComponent,
    PreviewPanelComponent,
    MetadataPanelComponent,
    DocumentIndexComponent,
    DocumentActionsComponent,
  ],
  template: `
    <div class="page-container">
      @if (facade.isLoading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <p>Caricamento in corso...</p>
        </div>
      }

      @if (facade.error(); as errorMsg) {
        <div class="error-banner"><strong>Errore:</strong> {{ errorMsg }}</div>
      }

      @if (facade.item(); as item) {
        <app-document-actions [itemId]="itemId()" [itemType]="itemType()"></app-document-actions>

        <div class="detail-view">
          <div class="metadata-section" [class.expanded]="!isPreviewOpen()">
            <app-metadata-panel
              [tree]="item.metadataTree"
              [ispreviewOpen]="isPreviewOpen()"
              (previewRequested)="togglePreview()"
            ></app-metadata-panel>
          </div>

          @if (isPreviewOpen()) {
            <div class="preview-section">
              <app-document-toolbar
                [titolo]="item.title"
                [formato]="item.type === 'DOCUMENT' ? getFileExtension(item.title) : 'FASCICOLO'"
                [zoomLevel]="zoomLevel()"
                [parentAggregateId]="fromAggreggate()"
                (zoomIn)="handleZoomIn()"
                (zoomOut)="handleZoomOut()"
                (resetZoom)="handleResetZoom()"
                (closePreview)="togglePreview()"
                (navigateBack)="goBackToAggregate($event)"
              ></app-document-toolbar>

              <div class="preview-content">
                @if (item.type === 'DOCUMENT') {
                  <app-preview-panel [fileData]="item.fileUrl" [zoomLevel]="zoomLevel()">
                  </app-preview-panel>
                } @else if (item.type === 'AGGREGATE') {
                  <div class="aggregate-content">
                    <app-document-index
                      [items]="item.documentIndex || []"
                      (documentSelected)="onDocumentSelected($event)"
                    >
                    </app-document-index>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #f8fafc;
        font-family: 'Inter', system-ui, sans-serif;
      }

      /* Il contenitore principale ora usa flex-direction: row per affiancare gli elementi */
      .detail-view {
        display: flex;
        flex-direction: row;
        flex: 1;
        overflow: hidden;
      }

      /* Sezione Sinistra (Metadati) */
      .metadata-section {
        width: 450px;
        height: 100%;
        border-right: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        overflow-y: auto; /* <-- AGGIUNGI QUESTO PER SICUREZZA */
        background: #ffffff;
      }

      /* Quando l'anteprima è chiusa, i metadati si espandono a tutto schermo */
      .metadata-section.expanded {
        width: 100%;
        max-width: none;
        border-right: none;
      }

      /* Sezione Destra (Anteprima/Tabella) */
      .preview-section {
        flex: 1; /* Prende tutto lo spazio rimanente a destra */
        display: flex;
        flex-direction: column;
        background: #ffffff;
        min-width: 0; /* Previene overflow su schermi piccoli */
      }

      .preview-content {
        flex: 1;
        background: #e2e8f0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .aggregate-content {
        flex: 1;
        overflow-y: auto;
        background: #f8fafc;
      }

      /* Utility */
      .loading-overlay {
        padding: 2rem;
        background: #eff6ff;
        color: #1e3a8a;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #bfdbfe;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .error-banner {
        padding: 1rem 1.5rem;
        background: #fef2f2;
        color: #b91c1c;
        border-bottom: 1px solid #fecaca;
        text-align: center;
      }
    `,
  ],
})
export class ItemDetailPageComponent {
  facade = inject(ITEM_DETAIL_FACADE_TOKEN);
  private readonly router = inject(Router);

  itemId = input.required<string>();
  itemType = input.required<'DOCUMENT' | 'AGGREGATE'>();

  fromAggreggate = input<string | null>(null);

  zoomLevel = signal<number>(1);

  // ORA PARTE CHIUSO DI DEFAULT! Così vedi solo i metadati all'inizio
  isPreviewOpen = signal<boolean>(false);

  private readonly ZOOM_STEP = 0.2;

  constructor() {
    effect(() => {
      // Angular traccia automaticamente this.itemId() e this.itemType().
      // Quando l'URL cambia, questa funzione viene invocata di nuovo da sola!
      this.facade.loadItem(this.itemId(), this.itemType());

      // BONUS UX: Se entriamo in un documento, apriamo subito la parte destra
      // Se navighiamo verso un fascicolo, teniamola chiusa per mostrare l'albero.
      if (this.itemType() === 'DOCUMENT') {
        this.isPreviewOpen.set(true);
      } else {
        this.isPreviewOpen.set(false);
      }
    });
  }

  onDocumentSelected(docId: string) {
    this.router.navigate(['/detail', 'DOCUMENT', docId], {
      queryParams: { fromAggregate: this.itemId() }, // Passiamo l'ID del fascicolo come parametro!
    });
  }

  goBackToAggregate(aggregateId: string) {
    this.router.navigate(['/detail', 'AGGREGATE', aggregateId]);
  }

  // QUESTO È IL METODO MAGICO CHE FA COMPARIRE/SCOMPARIRE LA PARTE DESTRA
  togglePreview() {
    this.isPreviewOpen.update((v) => !v);
  }

  handleZoomIn() {
    this.zoomLevel.update((z) => Math.min(z + this.ZOOM_STEP, 3));
  }

  handleZoomOut() {
    this.zoomLevel.update((z) => Math.max(z - this.ZOOM_STEP, 0.5));
  }

  handleResetZoom() {
    this.zoomLevel.set(1);
  }

  getFileExtension(filename: string): string {
    if (!filename) return 'SCONOSCIUTO';
    const parts = filename.split('.');
    if (parts.length === 1) return 'FILE';
    return parts.pop()!.toUpperCase();
  }
}
