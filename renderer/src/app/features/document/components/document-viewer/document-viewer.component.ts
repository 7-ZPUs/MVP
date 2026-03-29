import { Component, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT_FACADE_TOKEN } from '../../contracts/IDocumentFacade';
import { AppError, ErrorCode, ErrorCategory, ErrorSeverity } from '../../../../shared/domain';
import { MimeType } from '../../domain/document.models';
import { PreviewPanelComponent } from '../preview-panel/preview-panel.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, PreviewPanelComponent, ErrorDialogComponent],
  template: `
    <div class="viewer-wrapper">
      @if (error(); as err) {
        <app-error-dialog [error]="err" (onRetry)="loadBlob()"></app-error-dialog>
      }

      <app-preview-panel
        [src]="src()"
        [loading]="loading()"
        [error]="error()"
        [mimeType]="mimeType()"
        (unsupportedFormat)="onUnsupportedFormat()"
      >
      </app-preview-panel>
    </div>
  `,
  styles: [
    `
      .viewer-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
    `,
  ],
})
export class DocumentViewerComponent {
  private readonly facade = inject(DOCUMENT_FACADE_TOKEN);

  documentId = input.required<string>();
  mimeType = input.required<MimeType>();

  // Stato interno per il Blob
  src = signal<Uint8Array | null>(null);
  loading = signal<boolean>(false);
  error = signal<AppError | null>(null);

  constructor() {
    effect(() => {
      // Quando cambia l'ID, carichiamo il nuovo file binario
      if (this.documentId()) {
        this.loadBlob();
      }
    });
  }

  async loadBlob() {
    this.loading.set(true);
    this.error.set(null);
    this.src.set(null);

    try {
      const blob = await this.facade.getFileBlob(this.documentId());
      this.src.set(blob);
    } catch (err) {
      // L'errore è già un AppError formattato dall'ErrorHandler nel Facade
      this.error.set(err as AppError);
    } finally {
      this.loading.set(false);
    }
  }

  onUnsupportedFormat() {
    // Come da C4, se il renderer non supporta il formato, mostriamo un errore
    this.error.set({
      code: ErrorCode.DOC_FORMAT_UNSUPPORTED,
      category: ErrorCategory.DOMAIN,
      severity: ErrorSeverity.WARNING,
      recoverable: false,
      message: "Formato del documento non supportato per l'anteprima.",
      source: 'DocumentViewerComponent',
      context: null,
      detail: null,
    });
  }
}
