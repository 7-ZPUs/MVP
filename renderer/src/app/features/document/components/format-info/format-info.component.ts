import { Component, input } from '@angular/core';
import { FormatInfo } from '../../domain/document.models';

@Component({
  selector: 'app-format-info',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Formato File</h3>
      <div class="data-row">
        <span class="label">Tipo/MIME:</span> <span class="value">{{ data().tipo }}</span>
      </div>
      <div class="data-row">
        <span class="label">Prodotto:</span>
        <span class="value">{{ data().prodotto }} {{ data().versione }}</span>
      </div>
      <div class="data-row">
        <span class="label">Produttore:</span> <span class="value">{{ data().produttore }}</span>
      </div>
      <div class="data-row">
        <span class="label">Algoritmo Impronta:</span>
        <span class="value">{{ data().algoritmoImpronta }}</span>
      </div>
      <div class="data-row">
        <span class="label">Impronta:</span>
        <span class="value hash-val">{{ data().impronta }}</span>
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
      .hash-val {
        word-break: break-all;
        font-family: monospace;
        font-size: 0.85rem;
        background: #e2e8f0;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
      }
    `,
  ],
})
export class FormatInfoComponent {
  data = input.required<FormatInfo>();
}
