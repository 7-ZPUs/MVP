import { Component, inject, input, signal, computed, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importiamo i Token appena creati!
import { OUTPUT_FACADE_TOKEN } from '../../../../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../../../../shared/interfaces/integrity.interfaces';
import { ExportPageComponent } from '../../../../../feature/export-manager/ui/smart/export-page/export-page.component';

@Component({
  selector: 'app-document-actions',
  standalone: true,
  imports: [CommonModule, ExportPageComponent],
  template: `
    <div class="actions-bar">
      <div class="left-actions">
        <span class="context-label"
          >Azioni su
          {{
            itemType() === 'DOCUMENT'
              ? 'Documento'
              : itemType() === 'PROCESS'
                ? 'Processo'
                : itemType() === 'DOCUMENT_CLASS'
                  ? 'Classe Documentale'
                  : 'Fascicolo'
          }}</span
        >
      </div>

      <div class="right-actions">
        <!-- Mostra etichetta di stato verifica -->
        @if (verificationStatus()) {
          <div class="status-label" [ngClass]="verificationStatus()?.toLowerCase() || ''">
            {{
              verificationStatus() === 'VALID'
                ? 'Verificato'
                : verificationStatus() === 'INVALID'
                  ? 'Corrotto'
                  : 'Sconosciuto'
            }}
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
            <i class="icon bi bi-shield-check" aria-hidden="true"></i> Verifica Integrità
          }
        </button>

        @if (itemType() === 'DOCUMENT') {
          <app-export-page [documentId]="itemId()"></app-export-page>
        }
      </div>
    </div>
  `,
  styleUrl: './document-actions.component.scss',
})
export class DocumentActionsComponent {
  // Input di base
  itemId = input.required<string>();
  itemType = input.required<'DOCUMENT' | 'AGGREGATE' | 'PROCESS' | 'DOCUMENT_CLASS'>();

  // Notifica quando un'azione (es. verifica) è completata
  actionCompleted = output<void>();

  // Stato iniziale preso da db/back-end
  initialVerificationStatus = input<string | undefined | null>();

  // Iniezione tramite Token (Dependency Inversion!)
  outputFacade = inject(OUTPUT_FACADE_TOKEN);
  integrityFacade = inject(INTEGRITY_FACADE_TOKEN);

  // Deriviamo lo stato: se abbiamo appena fatto noi una verifica usiamo quel valore (manualStatus),
  // altrimenti usiamo quello passato inizialmente dal parent
  manualStatus = signal<string | null>(null);

  resetManualStatusEffect = effect(
    () => {
      // Quando itemId() o itemType() cambiano, resettiamo il manualStatus locale
      const _id = this.itemId();
      const _type = this.itemType();
      this.manualStatus.set(null);
    },
    { allowSignalWrites: true },
  );

  verificationStatus = computed(() => {
    return this.manualStatus() || this.initialVerificationStatus() || null;
  });

  onExport() {
    this.outputFacade.exportPdf({
      documentId: this.itemId(),
      tipo: this.itemType() as 'DOCUMENT' | 'AGGREGATE' | 'PROCESS',
    });
  }

  onPrint() {
    this.outputFacade.print({
      documentId: this.itemId(),
      tipo: this.itemType() as 'DOCUMENT' | 'AGGREGATE' | 'PROCESS',
    });
  }

  onVerify() {
    this.integrityFacade
      .verifyItem(this.itemId(), this.itemType())
      .then((status) => {
        this.manualStatus.set(status);
        this.actionCompleted.emit();
      })
      .catch((err) => {
        console.error('Verification failed', err);
        this.manualStatus.set('UNKNOWN');
        this.actionCompleted.emit();
      });
  }
}
