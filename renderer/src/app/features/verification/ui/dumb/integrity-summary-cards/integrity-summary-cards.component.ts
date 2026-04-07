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
  styles: [
    `
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s;
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      .icon {
        font-size: 2.5rem;
        opacity: 0.9;
      }
      .content {
        display: flex;
        flex-direction: column;
      }
      .number {
        font-size: 2.25rem;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 0.25rem;
      }
      .label {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
      }

      /* Sfumature eleganti */
      .valid-card {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
      .invalid-card {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        color: #991b1b;
        border: 1px solid #fecaca;
      }
      .unknown-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        color: #334155;
        border: 1px solid #e2e8f0;
      }
    `,
  ],
})
export class IntegritySummaryCardsComponent {
  stats = input.required<IntegrityOverviewStats>();
}
