import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer'; // Assicurati di aver fatto npm install ng2-pdf-viewer

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
          [zoom]="zoomLevel()"
          style="display: block; width: 100%; height: 100%;"
        >
        </pdf-viewer>
      } @else {
        <div class="placeholder">Nessun file da visualizzare o documento non ancora scaricato.</div>
      }
    </div>
  `,
  styles: [
    `
      .pdf-container {
        width: 100%;
        height: 100%;
        background-color: #525659;
        overflow: auto;
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
export class PreviewPanelComponent {
  // Riceve i dati crudi del file e il livello di zoom dalla Smart Page
  fileData = input<any>();
  zoomLevel = input.required<number>();
}
