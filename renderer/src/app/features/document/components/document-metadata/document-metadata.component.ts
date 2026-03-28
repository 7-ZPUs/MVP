import { Component, input } from '@angular/core';
import { DocumentMetadata } from '../../domain/document.models'; // Assicurati di averlo nel file models

@Component({
  selector: 'app-document-metadata',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Metadati Principali</h3>
      <div class="data-row">
        <span class="label">Nome:</span> <span class="value">{{ data().nome }}</span>
      </div>
      <div class="data-row">
        <span class="label">Descrizione:</span> <span class="value">{{ data().descrizione }}</span>
      </div>
      <div class="data-row">
        <span class="label">Tipo Doc:</span> <span class="value">{{ data().tipoDocumentale }}</span>
      </div>
      <div class="data-row">
        <span class="label">Formazione:</span>
        <span class="value">{{ data().modalitaFormazione }}</span>
      </div>
      <div class="data-row">
        <span class="label">Riservatezza:</span>
        <span class="value">{{ data().riservatezza }}</span>
      </div>
      <div class="data-row">
        <span class="label">Versione:</span> <span class="value">{{ data().versione }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .metadata-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }
      .data-row {
        display: flex;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .label {
        font-weight: 600;
        color: #64748b;
        width: 140px;
        flex-shrink: 0;
      }
      .value {
        color: #1e293b;
        font-weight: 500;
      }
    `,
  ],
})
export class DocumentMetadataComponent {
  data = input.required<DocumentMetadata>();
}
