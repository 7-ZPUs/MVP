import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationData } from '../../domain/document.models';

@Component({
  selector: 'app-registration-data',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metadata-card">
      <h3 class="card-title">Dati di Registrazione</h3>
      <div class="data-row">
        <span class="label">Registro:</span>
        <span class="value">{{ data().tipoRegistro }}</span>
      </div>
      <div class="data-row">
        <span class="label">Flusso:</span>
        <span class="value badge">{{ data().flusso }}</span>
      </div>
      <div class="data-row">
        <span class="label">Protocollo:</span>
        <span class="value">N. {{ data().numero }} del {{ data().data }}</span>
      </div>
      <div class="data-row">
        <span class="label">Codice:</span>
        <span class="value mono">{{ data().codice }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      /* Usa gli stessi stili di base di AdminProcedureComponent */
      .metadata-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }
      .card-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      .data-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .label {
        font-weight: 600;
        color: #64748b;
        width: 100px;
        flex-shrink: 0;
      }
      .value {
        color: #1e293b;
        font-weight: 500;
      }
      .badge {
        background: #e2e8f0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .mono {
        font-family: monospace;
        background: #f1f5f9;
        padding: 2px 4px;
        border-radius: 4px;
      }
    `,
  ],
})
export class RegistrationDataComponent {
  data = input.required<RegistrationData>();
}
