import { Component, inject, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importiamo i Token appena creati!
import { OUTPUT_FACADE_TOKEN } from '../../../../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../../../../shared/interfaces/integrity.interfaces';

@Component({
  selector: 'app-document-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="actions-bar">
      <div class="left-actions">
        <span class="context-label"
          >Azioni su {{ itemType() === 'DOCUMENT' ? 'Documento' : 'Fascicolo' }}</span
        >
      </div>

      <div class="right-actions">
        <!-- Mostra etichetta di stato verifica -->
        @if (verificationStatus()) {
          <div class="status-label" [ngClass]="verificationStatus()?.toLowerCase() || ''">
            {{ verificationStatus() === 'VALID' ? '✅ Verificato' : 
               verificationStatus() === 'INVALID' ? '❌ Corrotto' : '⚠️ Sconosciuto' }}
          </div>
        }

        <button
          class="action-btn btn-verify"
          [disabled]="integrityFacade.isVerifying()"
          (click)="onVerify()"
        >
          @if (integrityFacade.isVerifying()) {
            <span class="spinner-small"></span> Verifica in corso...
          } @else {
            <span class="icon">🛡️</span> Verifica Integrità
          }
        </button>

        @if (itemType() === 'DOCUMENT') {
          <button
            class="action-btn btn-print"
            [disabled]="outputFacade.isWorking()"
            (click)="onPrint()"
          >
            <span class="icon">🖨️</span> Stampa
          </button>

          <button
            class="action-btn btn-export"
            [disabled]="outputFacade.isWorking()"
            (click)="onExport()"
          >
            @if (outputFacade.isWorking()) {
              <span class="spinner-small"></span> Attendere...
            } @else {
              <span class="icon">💾</span> Scarica / Esporta
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .actions-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: #1e293b;
        color: white;
      }
      .context-label {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        font-weight: 600;
      }
      .right-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .status-label {
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: bold;
        background: #334155;
        color: #f8fafc;
      }
      .status-label.valid {
        background: #059669;
      }
      .status-label.invalid {
        background: #dc2626;
      }
      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-verify {
        background: #3b82f6;
        color: white;
      }
      .btn-verify:hover:not(:disabled) {
        background: #2563eb;
      }
      .btn-print {
        background: #475569;
        color: white;
      }
      .btn-print:hover:not(:disabled) {
        background: #334155;
      }
      .btn-export {
        background: #10b981;
        color: white;
      }
      .btn-export:hover:not(:disabled) {
        background: #059669;
      }
      .spinner-small {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ],
})
export class DocumentActionsComponent {
  // Input di base
  itemId = input.required<string>();
  itemType = input.required<'DOCUMENT' | 'AGGREGATE'>();

  // Stato iniziale preso da db/back-end
  initialVerificationStatus = input<string | undefined | null>();

  // Iniezione tramite Token (Dependency Inversion!)
  outputFacade = inject(OUTPUT_FACADE_TOKEN);
  integrityFacade = inject(INTEGRITY_FACADE_TOKEN);

  // Deriviamo lo stato: se abbiamo appena fatto noi una verifica usiamo quel valore (manualStatus),
  // altrimenti usiamo quello passato inizialmente dal parent
  manualStatus = signal<string | null>(null);

  resetManualStatusEffect = effect(() => {
    // Quando itemId() o itemType() cambiano, resettiamo il manualStatus locale
    const id = this.itemId();
    const type = this.itemType();
    this.manualStatus.set(null);
  }, { allowSignalWrites: true });

  verificationStatus = computed(() => {
    return this.manualStatus() || this.initialVerificationStatus() || null;
  });

  onExport() {
    this.outputFacade.exportPdf({
      documentId: this.itemId(),
      tipo: this.itemType(),
    });
  }

  onPrint() {
    this.outputFacade.print({
      documentId: this.itemId(),
      tipo: this.itemType(),
    });
  }

  onVerify() {
    this.integrityFacade.verifyItem(this.itemId(), this.itemType()).then((status) => {
      this.manualStatus.set(status);
    }).catch(err => {
      console.error('Verification failed', err);
      this.manualStatus.set('UNKNOWN');
    });
  }
}
