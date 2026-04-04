import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-preview-panel',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  template: `
    <div class="pdf-container">
      @if (fileData()) {
        <pdf-viewer
          [src]="fileData()"
          [render-text]="true"
          [original-size]="false"
          [fit-to-page]="true"
          [zoom]="zoomLevel()"
          [show-all]="true"
          (error)="onPdfError($event)"
          (after-load-complete)="onPdfLoaded($event)"
          style="display: block; width: 100%; height: 100%;"
        >
        </pdf-viewer>
      } @else {
        <div class="placeholder">Nessun file da visualizzare.</div>
      }
    </div>
  `,
  styles: [
    `
      /* IL FIX È QUI: Diciamo al tag <app-preview-panel> di occupare tutto lo spazio */
      :host {
        display: block;
        width: 100%;
        height: 100%;
        flex: 1;
      }

      .pdf-container {
        width: 100%;
        height: 100%;
        background-color: #525659;
        position: relative;
      }

      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ccc;
        font-style: italic;
      }
    `,
  ],
})
export class PreviewPanelComponent implements OnInit {
  fileData = input<any>();
  zoomLevel = input.required<number>();

  ngOnInit() {
    // FIX OFFLINE: Puntiamo al file che abbiamo copiato tramite angular.json
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }

  onPdfError(error: any) {
    console.error('🚨 ERRORE NG2-PDF-VIEWER:', error);
  }

  onPdfLoaded(pdfInfo: any) {
    console.log('✅ PDF Caricato offline con successo! Pagine:', pdfInfo.numPages);
  }
}
