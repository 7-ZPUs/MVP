import { Component, input } from '@angular/core';
import { AipInfo } from '../../domain/document.models';

@Component({
  selector: 'app-aip-info',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Informazioni AIP</h3>
      <div class="data-row">
        <span class="label">Classe Documentale:</span>
        <span class="value">{{ data().classeDocumentale }}</span>
      </div>
      <div class="data-row">
        <span class="label">UUID:</span> <span class="value">{{ data().uuid }}</span>
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
export class AipInfoComponent {
  data = input.required<AipInfo>();
}
