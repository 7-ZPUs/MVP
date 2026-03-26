import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentIndexEntryVM } from '../../../domain/detail.view-models';

@Component({
  selector: 'app-document-index',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="index-container" aria-labelledby="index-title">
      <header class="index-header">
        <div class="title-group">
          <h3 id="index-title">Indice dei Documenti</h3>
          <span class="badge-count" [attr.aria-label]="items().length + ' documenti presenti'">
            {{ items().length }}
          </span>
        </div>
        <p class="subtitle">Elenco degli elementi contenuti in questa aggregazione.</p>
      </header>

      @if (items().length > 0) {
        <div class="table-responsive">
          <table class="index-table" aria-label="Tabella dei documenti nell'aggregazione">
            <thead>
              <tr>
                <th scope="col" class="col-icon"></th>
                <th scope="col">Identificativo / Titolo</th>
                <th scope="col">Tipo</th>
                <th scope="col" class="col-actions">Azioni</th>
              </tr>
            </thead>
            <tbody>
              @for (doc of items(); track doc.identificativo) {
                <tr class="doc-row">
                  <td class="col-icon">
                    <span class="doc-icon" aria-hidden="true">📄</span>
                  </td>
                  <td>
                    <div class="doc-info">
                      <strong class="doc-title">{{
                        doc.titolo || 'Documento Senza Titolo'
                      }}</strong>
                      <span class="doc-id">ID: {{ doc.identificativo }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="type-badge">{{ doc.tipo }}</span>
                  </td>
                  <td class="col-actions">
                    <button
                      class="btn-view"
                      (click)="documentSelected.emit(doc.identificativo)"
                      [attr.aria-label]="'Visualizza dettaglio del documento ' + doc.identificativo"
                    >
                      Visualizza
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">📭</span>
          <p>Questa aggregazione non contiene ancora alcun documento.</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .index-container {
        background: #ffffff;
        border-radius: 12px;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 2px 4px -1px rgba(0, 0, 0, 0.03);
        border: 1px solid #e2e8f0;
        overflow: hidden;
        font-family: 'Inter', system-ui, sans-serif;
        margin: 1.5rem;
      }

      .index-header {
        padding: 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .title-group {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.25rem;
      }

      .index-header h3 {
        margin: 0;
        color: #0f172a;
        font-size: 1.25rem;
        font-weight: 700;
      }

      .badge-count {
        background: #e0e7ff;
        color: #3730a3;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
      }

      .table-responsive {
        overflow-x: auto;
      }

      .index-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }

      .index-table th {
        background: #ffffff;
        padding: 1rem 1.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e2e8f0;
      }

      .index-table td {
        padding: 1rem 1.5rem;
        vertical-align: middle;
        border-bottom: 1px solid #f1f5f9;
      }

      .doc-row {
        transition: background-color 0.2s;
      }

      .doc-row:hover {
        background-color: #f8fafc;
      }

      .doc-row:last-child td {
        border-bottom: none;
      }

      .col-icon {
        width: 50px;
        text-align: center;
      }

      .doc-icon {
        font-size: 1.5rem;
        opacity: 0.8;
      }

      .doc-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .doc-title {
        color: #1e293b;
        font-size: 1rem;
        font-weight: 600;
      }

      .doc-id {
        color: #94a3b8;
        font-size: 0.8rem;
        font-family: 'Courier New', Courier, monospace;
      }

      .type-badge {
        display: inline-block;
        background: #f1f5f9;
        color: #475569;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        border: 1px solid #cbd5e1;
      }

      .col-actions {
        text-align: right;
        width: 120px;
      }

      .btn-view {
        background: #ffffff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-view:hover {
        background: #eff6ff;
        border-color: #93c5fd;
      }

      /* GESTIONE FOCUS ACCESSIBILE PER TASTIERA */
      .btn-view:focus-visible {
        outline: 3px solid #93c5fd;
        outline-offset: 2px;
      }

      .empty-state {
        padding: 4rem 2rem;
        text-align: center;
        color: #64748b;
      }

      .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
        opacity: 0.5;
      }
    `,
  ],
})
export class DocumentIndexComponent {
  // Riceve l'elenco dei documenti dal componente Smart
  items = input.required<DocumentIndexEntryVM[]>();

  // Emette l'ID del documento quando l'utente clicca su "Visualizza"
  documentSelected = output<string>();
}
