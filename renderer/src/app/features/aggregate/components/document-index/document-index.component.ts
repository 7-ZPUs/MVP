import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentIndexEntryDTO } from '../../../../shared/domain/dto/AggregateDTO';

@Component({
  selector: 'app-document-index',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="index-container">
      <h2 class="section-title">Indice dei Documenti</h2>

      <div class="table-wrapper">
        <table class="index-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Documento</th>
              <th>Azione</th>
            </tr>
          </thead>
          <tbody>
            @for (doc of items(); track doc.routeId || doc.identificativo) {
              <tr class="table-row">
                <td>
                  <span class="badge">{{ doc.tipoDocumento }}</span>
                </td>
                <td>{{ doc.identificativo }}</td>
                <td>
                  <button class="btn-view" (click)="onView(doc.routeId || doc.identificativo)">
                    👁️ Visualizza
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="empty-state">
                  Nessun documento presente in questo fascicolo.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .index-container {
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        height: 100%;
      }
      .section-title {
        margin-top: 0;
        color: #1e293b;
        font-size: 1.2rem;
        margin-bottom: 1rem;
      }
      .table-wrapper {
        overflow-x: auto;
      }
      .index-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .index-table th {
        background: #f8fafc;
        padding: 0.75rem 1rem;
        color: #475569;
        font-weight: 600;
        border-bottom: 2px solid #e2e8f0;
      }
      .index-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e2e8f0;
        color: #334155;
        vertical-align: middle;
      }
      .table-row:hover {
        background: #f1f5f9;
      }
      .badge {
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .mono {
        font-family: monospace;
        font-size: 0.95rem;
      }
      .btn-view {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
      }
      .btn-view:hover {
        background: #2563eb;
      }
      .empty-state {
        text-align: center;
        font-style: italic;
        color: #94a3b8;
        padding: 2rem !important;
      }
    `,
  ],
})
export class DocumentIndexComponent {
  items = input.required<DocumentIndexEntryDTO[]>();
  documentSelected = output<string>();

  onView(id: string) {
    this.documentSelected.emit(id);
  }
}
