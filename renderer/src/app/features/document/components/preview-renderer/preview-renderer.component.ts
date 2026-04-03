import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MimeType } from '../../domain/document.models';

@Component({
  selector: 'app-preview-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="renderer-container">
      @switch (mimeType()) {
        @case (MimeType.PDF) {
          <div class="pdf-wrapper">
            <object [data]="blobUrl" type="application/pdf" class="pdf-viewer">
              Anteprima PDF non disponibile.
            </object>
          </div>
        }

        @case (MimeType.IMAGE) {
          <div class="image-wrapper">
            <img [src]="blobUrl" alt="Anteprima Immagine" class="preview-img" />
          </div>
        }

        @case (MimeType.TEXT) {
          <div class="text-wrapper">
            <pre>{{ textContent }}</pre>
          </div>
        }

        @default {
          <div class="unsupported">Formato non supportato</div>
        }
      }
    </div>
  `,
  styles: [
    `
      .renderer-container {
        width: 100%;
        height: 100%;
        background: #f1f5f9;
        display: flex;
        flex-direction: column;
      }

      /* Stile specifico per fare in modo che il PDF riempia l'area a disposizione */
      .pdf-viewer {
        width: 100%;
        height: 100%;
        display: block;
      }

      .pdf-wrapper {
        width: 100%;
        height: 100%;
      }

      .image-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        padding: 1rem;
      }
      .preview-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .text-wrapper {
        padding: 2rem;
        width: 100%;
        height: 100%;
        overflow: auto;
        font-family: monospace;
        white-space: pre-wrap;
        background: white;
        color: #334155;
      }

      .unsupported {
        display: none;
      }
    `,
  ],
})
export class PreviewRendererComponent {
  src = input.required<Uint8Array>();
  mimeType = input.required<MimeType>();

  unsupportedFormat = output<void>();

  MimeType = MimeType;

  blobUrl: string | undefined;
  textContent: string | undefined;

  constructor() {
    // Usiamo l'effect con la funzione di cleanup (onCleanup) per evitare Memory Leak in Electron!
    effect((onCleanup) => {
      const data = this.src();
      const type = this.mimeType();

      if (type === MimeType.UNSUPPORTED) {
        this.unsupportedFormat.emit();
        return;
      }

      if (data) {
        if (type === MimeType.TEXT) {
          // Decodifica nativa per i file di testo
          this.textContent = new TextDecoder('utf-8').decode(data);
        } else if (type === MimeType.IMAGE || type === MimeType.PDF) {
          const mime = type === MimeType.PDF ? 'application/pdf' : 'image/png';
          const blob = new Blob([new Uint8Array(data)], { type: mime });
          this.blobUrl = URL.createObjectURL(blob);
        }
      }

      // IMPORTANTE: Pulizia della memoria di Electron quando il componente viene distrutto
      // o l'ID del documento cambia (e l'effect viene rieseguito).
      onCleanup(() => {
        if (this.blobUrl) {
          URL.revokeObjectURL(this.blobUrl);
          this.blobUrl = undefined;
        }
      });
    });
  }
}
