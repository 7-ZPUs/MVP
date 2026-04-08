import { Component, input } from '@angular/core';
import { IntegrityOverviewStats } from '../../../domain/integrity.view-models';

@Component({
  selector: 'app-integrity-summary-cards',
  standalone: true,
  template: `
    <section class="cards-grid" aria-label="Riepilogo statistico delle verifiche">
      <div class="card valid-card">
        <div class="icon" aria-hidden="true">🛡️</div>
        <div class="content">
          <div class="number" aria-label="Elementi Integri: ">{{ stats().validProcesses }}</div>
          <div class="label" aria-hidden="true">Elementi Integri</div>
        </div>
      </div>
      <div class="card invalid-card">
        <div class="icon" aria-hidden="true">⚠️</div>
        <div class="content">
          <div class="number" aria-label="Elementi Corrotti: ">{{ stats().invalidProcesses }}</div>
          <div class="label" aria-hidden="true">Elementi Corrotti</div>
        </div>
      </div>
      <div class="card unknown-card">
        <div class="icon" aria-hidden="true">⏳</div>
        <div class="content">
          <div class="number" aria-label="In Attesa di Verifica: ">
            {{ stats().unverifiedProcesses }}
          </div>
          <div class="label" aria-hidden="true">In Attesa di Verifica</div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './integrity-summary-cards.component.scss',
})
export class IntegritySummaryCardsComponent {
  stats = input.required<IntegrityOverviewStats>();
}
