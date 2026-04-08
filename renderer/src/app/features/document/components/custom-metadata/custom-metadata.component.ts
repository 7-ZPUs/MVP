import { Component, input } from '@angular/core';
import { CustomMetadataEntry } from '../../domain/document.models';

@Component({
  selector: 'app-custom-metadata',
  standalone: true,
  template: `
    <div class="metadata-card" data-testid="custom-metadata-card">
      <h3 data-testid="custom-metadata-heading">Metadati Aggiuntivi</h3>
      @if (!entries() || entries()!.length === 0) {
        <p class="empty-message" data-testid="custom-metadata-empty">Nessun metadato aggiuntivo presente.</p>
      } @else {
        <div class="table-container" data-testid="custom-metadata-table-container">
          <table data-testid="custom-metadata-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Valore</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.nome) {
                <tr [attr.data-testid]="'custom-metadata-row-' + toTestIdSuffix(entry.nome)">
                  <td data-testid="custom-metadata-name">{{ entry.nome }}</td>
                  <td data-testid="custom-metadata-value">{{ entry.valore }}</td>
                </tr>
              }
            </tbody>
          </table>
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
      .empty-message {
        color: #64748b;
        font-style: italic;
        font-size: 0.9rem;
      }
      .table-container {
        overflow-x: auto;
        margin-top: 0.5rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      th {
        text-align: left;
        padding: 0.5rem;
        color: #64748b;
        border-bottom: 2px solid #e2e8f0;
        font-weight: 600;
      }
      td {
        padding: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
      }
      tr:last-child td {
        border-bottom: none;
      }
    `,
  ],
})
export class CustomMetadataComponent {
  entries = input<CustomMetadataEntry[]>();

  toTestIdSuffix(value: string): string {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
  }
}
