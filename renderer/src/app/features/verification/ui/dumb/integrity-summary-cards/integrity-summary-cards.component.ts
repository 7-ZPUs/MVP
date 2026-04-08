import { Component, input } from '@angular/core';
import { IntegrityOverviewStats } from '../../../domain/integrity.view-models';

@Component({
  selector: 'app-integrity-summary-cards',
  standalone: true,
  template: `
    <section class="cards-grid" aria-label="Riepilogo statistico delle verifiche">
      <div class="card valid-card">
        <i class="icon bi bi-shield-check" aria-hidden="true"></i>
        <div class="content">
          <div class="number" aria-label="Elementi Integri: ">{{ stats().validProcesses }}</div>
          <div class="label" aria-hidden="true">Elementi Integri</div>
        </div>
      </div>
      <div class="card invalid-card">
        <i class="icon bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        <div class="content">
          <div class="number" aria-label="Elementi Corrotti: ">{{ stats().invalidProcesses }}</div>
          <div class="label" aria-hidden="true">Elementi Corrotti</div>
        </div>
      </div>
      <div class="card unknown-card">
        <i class="icon bi bi-hourglass-split" aria-hidden="true"></i>
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
