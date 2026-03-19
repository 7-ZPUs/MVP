import { Component, inject, OnInit, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDetailFacade } from '../../../../../core/facades/document-detail.facade';
import { DocumentToolbarComponent } from '../../components/document-toolbar/document-toolbar.component';
import { PreviewPanelComponent } from '../../components/preview-panel/preview-panel.component';
import { MetadataPanelComponent } from '../../components/metadata-panel/metadata-panel.component';

@Component({
  selector: 'app-document-detail-page',
  standalone: true,
  imports: [CommonModule, DocumentToolbarComponent, PreviewPanelComponent, MetadataPanelComponent],
  template: `
    <div class="page-container">
      @if (facade.isLoading()) {
        <div class="loading-overlay">Caricamento documento in corso...</div>
      }

      @if (facade.error(); as errorMsg) {
        <div class="error-banner">{{ errorMsg }}</div>
      }

      @if (facade.document(); as doc) {
        <app-document-toolbar
          [titolo]="doc.titolo"
          [formato]="doc.formato"
          [zoomLevel]="zoomLevel()"
          (zoomIn)="handleZoomIn()"
          (zoomOut)="handleZoomOut()"
          (resetZoom)="handleResetZoom()"
        >
        </app-document-toolbar>

        <div class="split-view">
          <div class="preview-section">
            <app-preview-panel [fileData]="doc.fileData" [zoomLevel]="zoomLevel()">
            </app-preview-panel>
          </div>

          <div class="metadata-section">
            <app-metadata-panel [metadata]="doc.metadata"></app-metadata-panel>
          </div>
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
        background: #f5f5f5;
      }
      .split-view {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .preview-section {
        flex: 7;
        background: #525659;
      } /* 70% di spazio al PDF */
      .metadata-section {
        flex: 3;
        overflow: hidden;
      } /* 30% di spazio ai Metadati */
      .loading-overlay {
        padding: 1rem;
        background: #e3f2fd;
        color: #1976d2;
        text-align: center;
        font-weight: bold;
      }
      .error-banner {
        padding: 1rem;
        background: #ffebee;
        color: #c62828;
        text-align: center;
      }
    `,
  ],
})
export class DocumentDetailPageComponent implements OnInit {
  facade = inject(DocumentDetailFacade);
  documentId = input<string>();

  // Stato locale UI gestito tramite Signal
  zoomLevel = signal<number>(1.0);
  private readonly ZOOM_STEP = 0.2;

  ngOnInit() {
    const idToLoad = this.documentId() || 'DOC-999';
    this.facade.loadDocument(idToLoad);
  }

  // --- LOGICA DI CONTROLLO UI ---

  handleZoomIn() {
    this.zoomLevel.update((z) => Math.min(z + this.ZOOM_STEP, 3.0)); // Max 300%
  }

  handleZoomOut() {
    this.zoomLevel.update((z) => Math.max(z - this.ZOOM_STEP, 0.5)); // Min 50%
  }

  handleResetZoom() {
    this.zoomLevel.set(1.0); // Reset a 100%
  }
}
