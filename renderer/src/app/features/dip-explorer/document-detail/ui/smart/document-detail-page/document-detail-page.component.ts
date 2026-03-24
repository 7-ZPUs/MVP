import { Component, inject, OnInit, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDetailFacade } from '../../../services/document-detail.facade';
import { DocumentToolbarComponent } from '../../dumb/document-toolbar/document-toolbar.component';
import { PreviewPanelComponent } from '../../dumb/preview-panel/preview-panel.component';
import { MetadataPanelComponent } from '../../dumb/metadata-panel/metadata-panel.component';

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
        <div class="detail-view">
          <div class="metadata-section">
            <app-metadata-panel
              [metadata]="doc.DocumentoInformatico"
              (previewRequested)="openPreview()"
            ></app-metadata-panel>

            @if (isPreviewOpen()) {
              <div class="preview-overlay">
                <app-document-toolbar
                  [titolo]="doc.DocumentoInformatico.NomeDelDocumento"
                  [formato]="doc.DocumentoInformatico.IdentificativoDelFormato.Formato"
                  [zoomLevel]="zoomLevel()"
                  (zoomIn)="handleZoomIn()"
                  (zoomOut)="handleZoomOut()"
                  (resetZoom)="handleResetZoom()"
                  (closePreview)="closePreview()"
                >
                </app-document-toolbar>

                <div class="preview-section">
                  <app-preview-panel [fileData]="doc.fileData" [zoomLevel]="zoomLevel()">
                  </app-preview-panel>
                </div>
              </div>
            }
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
      .detail-view {
        position: relative;
        flex: 1;
        overflow: hidden;
      }
      .metadata-section {
        position: relative;
        height: 100%;
      }
      .preview-overlay {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        background: #ffffff;
      }
      .preview-section {
        flex: 1;
        background: #525659;
        overflow: hidden;
      }
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
  zoomLevel = signal<number>(1);
  isPreviewOpen = signal<boolean>(false);
  private readonly ZOOM_STEP = 0.2;

  ngOnInit() {
    const idToLoad = this.documentId() || 'DOC-999';
    this.facade.loadDocument(idToLoad);
  }

  // --- LOGICA DI CONTROLLO UI ---

  openPreview() {
    this.isPreviewOpen.set(true);
  }

  closePreview() {
    this.isPreviewOpen.set(false);
  }

  handleZoomIn() {
    this.zoomLevel.update((z) => Math.min(z + this.ZOOM_STEP, 3)); // Max 300%
  }

  handleZoomOut() {
    this.zoomLevel.update((z) => Math.max(z - this.ZOOM_STEP, 0.5)); // Min 50%
  }

  handleResetZoom() {
    this.zoomLevel.set(1); // Reset a 100%
  }
}
