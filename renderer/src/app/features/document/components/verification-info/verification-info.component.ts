import { Component, input } from '@angular/core';
import { VerificationInfo } from '../../domain/document.models';

@Component({
  selector: 'app-verification-info',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Verifiche e Formati</h3>
      <div class="data-row">
        <span class="label">Firma Digitale:</span>
        <span class="value">{{ data().firmaDigitale }}</span>
      </div>
      <div class="data-row">
        <span class="label">Sigillo:</span> <span class="value">{{ data().sigillo }}</span>
      </div>
      <div class="data-row">
        <span class="label">Marcatura Temporale:</span>
        <span class="value">{{ data().marcaturaTemporale }}</span>
      </div>
      <div class="data-row">
        <span class="label">Conformità Copie:</span>
        <span class="value">{{ data().conformitaCopie }}</span>
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
        width: 160px;
        flex-shrink: 0;
      }
      .value {
        word-break: break-word;
        overflow-wrap: anywhere;
        color: #1e293b;
        font-weight: 500;
      }
    `,
  ],
})
export class VerificationInfoComponent {
  data = input.required<VerificationInfo>();
}
