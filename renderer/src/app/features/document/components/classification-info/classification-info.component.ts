import { Component, input } from '@angular/core';
import { ClassificationInfo } from '../../domain/document.models';

@Component({
  selector: 'app-classification-info',
  standalone: true,
  template: `
    <div class="metadata-card" data-testid="classification-card">
      <h3 data-testid="classification-heading">Classificazione</h3>
      <div class="data-row" data-testid="classification-row-indice">
        <span class="label">Indice:</span> <span class="value">{{ data().indice }}</span>
      </div>
      <div class="data-row" data-testid="classification-row-descrizione">
        <span class="label">Descrizione:</span> <span class="value">{{ data().descrizione }}</span>
      </div>
      <div class="data-row" data-testid="classification-row-uri-piano">
        <span class="label">Piano (URI):</span> <span class="value">{{ data().uriPiano }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        margin-bottom: 1rem;
      }
      .metadata-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
      }
      .metadata-card h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1rem;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      .data-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .data-row:last-child {
        margin-bottom: 0;
      }
      .label {
        font-weight: 600;
        color: #64748b;
        min-width: 140px;
        flex-shrink: 0;
      }
      .value {
        flex: 1;
        min-width: 0;
        word-break: break-all;
        overflow-wrap: anywhere;
        color: #1e293b;
        font-weight: 500;
      }
    `,
  ],
})
export class ClassificationInfoComponent {
  data = input.required<ClassificationInfo>();
}
