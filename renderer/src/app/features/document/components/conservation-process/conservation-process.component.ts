import { Component, input } from '@angular/core';
import { ConservationProcessData } from '../../domain/document.models';

@Component({
  selector: 'app-conservation-process',
  standalone: true,
  template: `
    <div class="metadata-card" data-testid="conservation-process-card">
      <h3 data-testid="conservation-process-heading">Processo di Conservazione</h3>
      <div class="data-row" data-testid="conservation-process-row-processo">
        <span class="label">Processo:</span> <span class="value">{{ data().processo }}</span>
      </div>
      <div class="data-row" data-testid="conservation-process-row-sessione">
        <span class="label">Sessione:</span> <span class="value">{{ data().sessione }}</span>
      </div>
      <div class="data-row" data-testid="conservation-process-row-data-inizio">
        <span class="label">Data Inizio:</span> <span class="value">{{ data().dataInizio }}</span>
      </div>
      @if (data().dataFine) {
        <div class="data-row" data-testid="conservation-process-row-data-fine">
          <span class="label">Data Fine:</span> <span class="value">{{ data().dataFine }}</span>
        </div>
      }
      @if (data().uuidTerminatore) {
        <div class="data-row" data-testid="conservation-process-row-uuid-terminatore">
          <span class="label">UUID Terminatore:</span>
          <span class="value">{{ data().uuidTerminatore }}</span>
        </div>
      }
      @if (data().canaleTerminazione) {
        <div class="data-row" data-testid="conservation-process-row-canale-terminazione">
          <span class="label">Canale Terminazione:</span>
          <span class="value">{{ data().canaleTerminazione }}</span>
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
export class ConservationProcessComponent {
  data = input.required<ConservationProcessData>();
}
