import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OUTPUT_FACADE_TOKEN,
  OutputAction,
  OutputContext,
} from '../../../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../../../shared/interfaces/integrity.interfaces';
import { OutputToolbarComponent } from '../output-toolbar/output-toolbar.component';

@Component({
  selector: 'app-document-actions',
  standalone: true,
  imports: [CommonModule, OutputToolbarComponent],
  template: `
    <div class="actions-bar">
      <div class="context-info">
        Azioni su: <strong>{{ itemType() === 'DOCUMENT' ? 'Documento' : 'Fascicolo' }}</strong>
      </div>

      <div class="actions-group">
        <button
          (click)="onVerifyIntegrity()"
          [disabled]="integrityFacade.isVerifying()"
          class="btn-verify"
        >
          @if (integrityFacade.isVerifying()) {
            <span class="spinner-small"></span> Verifica in corso...
          } @else {
            🛡️ Verifica Firme
          }
        </button>

        <app-output-toolbar
          [context]="outputContext"
          (onActionRequested)="onActionRequested($event)"
        >
        </app-output-toolbar>
      </div>
    </div>
  `,
  styles: [
    `
      .actions-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
      }
      .actions-group {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      .btn-verify {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .btn-verify:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid white;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class DocumentActionsComponent {
  // Iniezione Token
  public readonly outputFacade = inject(OUTPUT_FACADE_TOKEN);
  public readonly integrityFacade = inject(INTEGRITY_FACADE_TOKEN);

  // Input per definire il contesto
  itemId = input.required<string>();
  itemType = input.required<'DOCUMENT' | 'AGGREGATE'>();
  documentName = input<string>(''); // Opzionale, utile per documenti
  mimeType = input<string>(''); // Opzionale, utile per documenti

  // Creazione dinamica del contesto (come da nota C4) [cite: 35-36]
  get outputContext(): OutputContext {
    return {
      tipo: this.itemType(),
      documentId: this.itemId(),
      documentName: this.documentName(),
      mimeType: this.mimeType(),
    };
  }

  // Switch pattern dell'azione richiesta (come da nota C4) [cite: 38-39]
  async onActionRequested(action: OutputAction) {
    try {
      switch (action) {
        case OutputAction.PRINT:
          await this.outputFacade.print(this.outputContext);
          break;
        case OutputAction.EXPORT_PDF:
          await this.outputFacade.exportPdf(this.outputContext);
          break;
        case OutputAction.DOWNLOAD:
          await this.outputFacade.download(this.outputContext);
          break;
        case OutputAction.SAVE:
          // Qui si aprirebbe il FolderPickerDialogComponent come richiesto [cite: 26, 36]
          // const path = await dialog.open();
          // se validato, chiami this.outputFacade.save({ ...context, path })
          await this.outputFacade.save(this.outputContext);
          break;
      }
    } catch (err) {
      // L'errore verrà gestito a livello globale o con un toast
      console.error('Azione fallita', err);
    }
  }

  onVerifyIntegrity() {
    this.integrityFacade.verifyItem(this.itemId(), this.itemType());
  }
}
