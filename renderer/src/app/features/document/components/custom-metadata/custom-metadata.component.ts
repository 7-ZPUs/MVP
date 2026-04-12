import { Component, input } from '@angular/core';
import { CustomMetadataEntry } from '../../domain/document.models';
import { simplifyCustomMetadataLabel } from '../../../../shared/utils/custom-metadata-label.util';

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
                <th class="name-col">Nome</th>
                <th>Valore</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.nome) {
                <tr [attr.data-testid]="'custom-metadata-row-' + toTestIdSuffix(displayName(entry.nome))">
                  <td
                    class="name-cell"
                    [attr.title]="simplifyNames() ? entry.nome : null"
                    data-testid="custom-metadata-name"
                  >
                    {{ displayName(entry.nome) }}
                  </td>
                  <td class="value-cell" data-testid="custom-metadata-value">{{ entry.valore }}</td>
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
        overflow-x: hidden;
        margin-top: 0.5rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 0.9rem;
      }
      th {
        text-align: left;
        color: #64748b;
        border-bottom: 2px solid #e2e8f0;
        font-weight: 600;
      }

      th,
      td {
        padding: 0.5rem;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
        vertical-align: top;
      }

      .name-col,
      .name-cell {
        width: clamp(7.5rem, 38%, 13rem);
      }

      .name-cell {
        color: #334155;
        font-weight: 600;
      }

      .value-cell {
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
      }

      td {
        border-bottom: 1px solid #e2e8f0;
      }

      tr:last-child td {
        border-bottom: none;
      }
    `,
  ],
})
export class CustomMetadataComponent {
  entries = input<CustomMetadataEntry[]>();
  simplifyNames = input<boolean>(true);

  displayName(value: string): string {
    if (!this.simplifyNames()) {
      return value;
    }

    return simplifyCustomMetadataLabel(value) || value;
  }

  toTestIdSuffix(value: string): string {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
  }
}
