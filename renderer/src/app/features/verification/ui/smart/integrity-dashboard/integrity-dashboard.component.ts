import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INTEGRITY_FACADE_TOKEN } from '../../../contracts/IIntegrityFacade';
import { IntegritySummaryCardsComponent } from '../../dumb/integrity-summary-cards/integrity-summary-cards.component';
import { IntegrityCorruptedPanelComponent } from '../../dumb/integrity-corrupted-panel/integrity-corrupted-panel.component';
import { IntegrityValidPanelComponent } from '../../dumb/integrity-valid-panel/integrity-valid-panel.component';

@Component({
  selector: 'app-integrity-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IntegritySummaryCardsComponent,
    IntegrityCorruptedPanelComponent,
    IntegrityValidPanelComponent,
  ],
  template: `
    <main class="dashboard-container" aria-live="polite">
      <header class="dashboard-header">
        <div>
          <h2 id="dashboard-title">Stato Integrità DIP (ID: {{ currentDipId }})</h2>
          <p class="subtitle">Fotografia attuale delle verifiche crittografiche.</p>
        </div>
        <button
          (click)="startVerification()"
          [disabled]="facade.isVerifying()"
          class="btn-primary"
          aria-describedby="dashboard-title"
        >
          {{ facade.isVerifying() ? 'Verifica in corso...' : 'Avvia Nuova Verifica Globale' }}
        </button>
      </header>

      @if (facade.error()) {
        <div class="error-banner" role="alert">
          <strong>Errore durante la verifica:</strong> {{ facade.error() }}
        </div>
      }

      @if (facade.isVerifying()) {
        <section class="progress-section" aria-busy="true" aria-describedby="progress-status">
          <h3 id="progress-status">Ricalcolo hash in corso...</h3>
          <p class="progress-subtitle">L'operazione potrebbe richiedere alcuni minuti.</p>
          <div
            class="indeterminate-progress-bar"
            role="progressbar"
            aria-valuetext="Caricamento in corso"
          >
            <div class="indeterminate-bar-slider"></div>
          </div>
        </section>
      } @else {
        <app-integrity-summary-cards [stats]="facade.overviewStats()"></app-integrity-summary-cards>
        <app-integrity-corrupted-panel
          [nodes]="facade.corruptedNodes()"
        ></app-integrity-corrupted-panel>
        <app-integrity-valid-panel
          [nodes]="facade.validRolledUpNodes()"
        ></app-integrity-valid-panel>
      }
    </main>
  `,
  styles: [
    `
      .dashboard-container {
        font-family: 'Inter', system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f4f6f8;
        padding: 2rem;
        gap: 0;
        overflow-y: auto;
      }
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .dashboard-header h2 {
        margin: 0 0 0.25rem 0;
        color: #0f172a;
        font-size: 1.75rem;
        font-weight: 800;
      }
      .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 1rem;
      }

      .btn-primary {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        transition: all 0.2s;
      }
      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3);
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: wait;
        filter: grayscale(50%);
      }

      /* GESTIONE FOCUS ACCESSIBILE PER TASTIERA (TAB) */
      .btn-primary:focus-visible {
        outline: 3px solid #60a5fa;
        outline-offset: 3px;
      }

      .error-banner {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        border-left: 4px solid #ef4444;
      }

      .progress-section {
        background: white;
        padding: 3rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        text-align: center;
        margin-bottom: 2rem;
      }
      .progress-section h3 {
        color: #0f172a;
        margin-bottom: 0.5rem;
        font-size: 1.25rem;
      }
      .progress-subtitle {
        color: #64748b;
        margin-bottom: 2rem;
      }
      .indeterminate-progress-bar {
        position: relative;
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
      }
      .indeterminate-bar-slider {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        background-color: #3b82f6;
        width: 30%;
        border-radius: 8px;
        animation: indeterminateAnimation 1.5s infinite ease-in-out;
      }
      @keyframes indeterminateAnimation {
        0% {
          left: -30%;
          width: 30%;
        }
        50% {
          left: 30%;
          width: 70%;
        }
        100% {
          left: 100%;
          width: 30%;
        }
      }
    `,
  ],
})
export class IntegrityDashboardComponent implements OnInit {
  facade = inject(INTEGRITY_FACADE_TOKEN);
  currentDipId = 1;

  ngOnInit() {
    // Appena entriamo, carichiamo lo stato attuale del DB!
    this.facade.loadOverview(this.currentDipId);
  }

  startVerification() {
    // Il comando di verifica ora aggiornerà gli hash e poi richiamerà in automatico la loadOverview!
    this.facade.verifyDip(this.currentDipId).then(() => {
      // Aggiorniamo l'overview solo se non si sono verificati errori gravi durante la verifica
      if (!this.facade.error()) {
        this.facade.loadOverview(this.currentDipId);
      }
    });
  }
}
