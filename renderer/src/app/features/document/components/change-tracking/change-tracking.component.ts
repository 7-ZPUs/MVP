import { Component, input } from '@angular/core';
import { ChangeTrackingData } from '../../domain/document.models';

@Component({
  selector: 'app-change-tracking',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Tracciamento Modifiche</h3>
      <div class="data-row">
        <span class="label">Tipo Modifica:</span> <span class="value">{{ data().tipo }}</span>
      </div>
      <div class="data-row">
        <span class="label">Soggetto:</span> <span class="value">{{ data().soggetto }}</span>
      </div>
      <div class="data-row">
        <span class="label">Data:</span> <span class="value">{{ data().data }}</span>
      </div>
      <div class="data-row">
        <span class="label">ID Versione Precedente:</span>
        <span class="value">{{ data().idVersionePrecedente }}</span>
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
        width: 180px;
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
export class ChangeTrackingComponent {
  data = input.required<ChangeTrackingData>();
}
