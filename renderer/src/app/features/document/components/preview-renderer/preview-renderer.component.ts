import { Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
            <object [attr.data]="safeBlobUrl || blobUrl" type="application/pdf" class="pdf-viewer">
              Anteprima PDF non disponibile.
            </object>
          </div>
        }

        @case (MimeType.IMAGE) {
          <div class="image-wrapper">
            <img [src]="safeBlobUrl || blobUrl" alt="Anteprima Immagine" class="preview-img" />
          </div>
        }

        @case (MimeType.TEXT) {
          <div class="text-wrapper">
            <pre>{{ textContent }}</pre>
          </div>
        }

        @case (MimeType.XML) {
          <div class="text-wrapper xml-wrapper">
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
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
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
        font-family: 'Consolas', 'Courier New', monospace;
        white-space: pre-wrap;
        background: white;
        color: #334155;
      }

      .xml-wrapper {
        color: #166534;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
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
  private readonly sanitizer = inject(DomSanitizer);

  blobUrl: string | undefined;
  safeBlobUrl: SafeResourceUrl | undefined;
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
        if (type === MimeType.TEXT || type === MimeType.XML) {
          // Decodifica nativa per i file di testo o xml
          this.textContent = new TextDecoder('utf-8').decode(data);
        } else if (type === MimeType.IMAGE || type === MimeType.PDF) {
          const mime = type === MimeType.PDF ? 'application/pdf' : 'image/png';
          const blob = new Blob([new Uint8Array(data)], { type: mime });
          this.blobUrl = URL.createObjectURL(blob);
          this.safeBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
        }
      }

      // IMPORTANTE: Pulizia della memoria di Electron quando il componente viene distrutto
      // o l'ID del documento cambia (e l'effect viene rieseguito).
      onCleanup(() => {
        if (this.blobUrl) {
          URL.revokeObjectURL(this.blobUrl);
          this.blobUrl = undefined;
          this.safeBlobUrl = undefined;
        }
      });
    });
  }
}
