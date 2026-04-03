import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { DipTreeNode, Documento } from '../../../domain/models';

const SUPPORTED_PREVIEW_FORMATS = ['pdf', 'png', 'jpg', 'jpeg', 'tiff'];

@Component({
  selector:   'app-document-preview',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <section aria-label="Anteprima documento"
             aria-live="polite"
             aria-atomic="true">

      @if (node) {
        @if (previewAvailable) {
          <div class="preview-container"
               role="region"
               [attr.aria-label]="'Anteprima di ' + node.label">
            <h3>{{ node.label }}</h3>
            <div class="preview-area"
                 role="img"
                 [attr.aria-label]="'Contenuto del documento ' + node.label">
              <p>Anteprima del documento: <strong>{{ node.label }}</strong></p>
            </div>
          </div>
        } @else {
          <div class="preview-unavailable"
               role="status"
               aria-live="polite"
               [attr.aria-label]="'Anteprima non disponibile per ' + node.label">
            <p>Anteprima non disponibile per questo formato.</p>
            <small>Scarica il file per visualizzarlo.</small>
          </div>
        }
      } @else {
        <div class="no-selection"
             role="status"
             aria-live="polite"
             aria-label="Nessun documento selezionato">
          <p>Seleziona un documento per visualizzarlo.</p>
        </div>
      }

    </section>
  `,
})
export class DocumentPreviewComponent {
  @Input() node: DipTreeNode | null = null;

  get previewAvailable(): boolean {
    // 1. Se node è null, usciamo subito
    if (!this.node) return false;

    // 2. Se è un'istanza di Documento, usiamo il suo metodo
    if (this.node instanceof Documento) {
      return this.node.isAnteprimaDisponibile();
    }

    // 3. Per il controllo dell'estensione, usiamo l'operatore ? (safe navigation)
    // o salviamo il riferimento in una costante locale per rassicurare TypeScript
    const currentNode = this.node; 
    
    return SUPPORTED_PREVIEW_FORMATS.some(ext =>
      currentNode.label.toLowerCase().endsWith(`.${ext}`)
    );
  }
}