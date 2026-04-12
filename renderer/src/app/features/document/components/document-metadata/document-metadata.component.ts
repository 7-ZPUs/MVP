import { Component, input } from '@angular/core';
import { DocumentMetadata } from '../../domain/document.models'; // Assicurati di averlo nel file models
import { formatReadableDate } from '../../../../shared/utils/date.util';

@Component({
  selector: 'app-document-metadata',
  standalone: true,
  template: `
    <div class="metadata-card" data-testid="document-metadata-card">
      <h3 data-testid="document-metadata-heading">Metadati Principali</h3>
      <div class="data-row" data-testid="document-metadata-row-identificativo">
        <span class="label">Identificativo:</span>
        <span class="value">{{ data().identificativo }}</span>
      </div>
      <div class="data-row" data-testid="document-metadata-row-nome">
        <span class="label">Nome:</span> <span class="value">{{ data().nome }}</span>
      </div>
      <div class="data-row" data-testid="document-metadata-row-oggetto">
        <span class="label">Oggetto:</span> <span class="value">{{ data().oggetto }}</span>
      </div>
      <div class="data-row" data-testid="document-metadata-row-descrizione">
        <span class="label">Descrizione:</span> <span class="value">{{ data().descrizione }}</span>
      </div>
      @if (data().note) {
        <div class="data-row" data-testid="document-metadata-row-note">
          <span class="label">Note:</span>
          <span class="value">{{ data().note }}</span>
        </div>
      }
      @if (data().dataCreazione) {
        <div class="data-row" data-testid="document-metadata-row-data-creazione">
          <span class="label">Data Creazione:</span>
          <span class="value">{{ formatReadableDate(data().dataCreazione) }}</span>
        </div>
      }
      <div class="data-row" data-testid="document-metadata-row-tipo-doc">
        <span class="label">Tipo Doc:</span> <span class="value">{{ data().tipoDocumentale }}</span>
      </div>
      <div class="data-row" data-testid="document-metadata-row-formazione">
        <span class="label">Formazione:</span>
        <span class="value">{{ data().modalitaFormazione }}</span>
      </div>
      @if (data().paroleChiave && data().paroleChiave!.length > 0) {
        <div class="data-row" data-testid="document-metadata-row-parole-chiave">
          <span class="label">Parole Chiave:</span>
          <span class="value">{{ data().paroleChiave?.join(', ') }}</span>
        </div>
      }
      @if (data().lingua) {
        <div class="data-row" data-testid="document-metadata-row-lingua">
          <span class="label">Lingua:</span>
          <span class="value">{{ data().lingua }}</span>
        </div>
      }
      <div class="data-row" data-testid="document-metadata-row-riservatezza">
        <span class="label">Riservatezza:</span>
        <span class="value">{{ data().riservatezza }}</span>
      </div>
      <div class="data-row" data-testid="document-metadata-row-versione">
        <span class="label">Versione:</span> <span class="value">{{ data().versione }}</span>
      </div>
      @if (data().tempoDiConservazione) {
        <div class="data-row" data-testid="document-metadata-row-tempo-conservazione">
          <span class="label">Tempo Conservazione:</span>
          <span class="value">{{ data().tempoDiConservazione }}</span>
        </div>
      }
      @if (data().idIdentificativoDocumentoPrimario) {
        <div class="data-row" data-testid="document-metadata-row-id-doc-primario">
          <span class="label">ID Documento Primario:</span>
          <span class="value">{{ data().idIdentificativoDocumentoPrimario }}</span>
        </div>
      }
      @if (data().impronta !== 'N/A') {
        <div class="data-row" data-testid="document-metadata-row-impronta">
          <span class="label">Impronta ({{ data().algoritmoImpronta }}):</span>
          <span class="value hash-val" style="word-break: break-all;">{{ data().impronta }}</span>
        </div>
      }
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
        flex: 1;
        min-width: 0;
        word-break: break-word;
        overflow-wrap: anywhere;
        color: #1e293b;
        font-weight: 500;
      }
    `,
  ],
})
export class DocumentMetadataComponent {
  data = input.required<DocumentMetadata>();
  protected readonly formatReadableDate = formatReadableDate;
}
