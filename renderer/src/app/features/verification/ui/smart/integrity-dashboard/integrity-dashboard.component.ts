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
  styleUrl: './integrity-dashboard.component.scss',
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
