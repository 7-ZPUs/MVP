import { Component, input, output } from '@angular/core';
import { OutputContext, OutputAction } from '../../../../shared/interfaces/output.interfaces';

@Component({
  selector: 'app-output-toolbar',
  standalone: true,
  template: `
    <div class="toolbar-actions">
      @if (context().tipo === 'DOCUMENT') {
        <button (click)="requestAction(OutputAction.PRINT)" class="btn">
          <i class="bi bi-printer" aria-hidden="true"></i>
          Stampa
        </button>
        <button (click)="requestAction(OutputAction.DOWNLOAD)" class="btn">
          <i class="bi bi-download" aria-hidden="true"></i>
          Download
        </button>
        <button (click)="requestAction(OutputAction.EXPORT_PDF)" class="btn">
          <i class="bi bi-file-earmark-pdf" aria-hidden="true"></i>
          Esporta PDF
        </button>
      }
      <button (click)="requestAction(OutputAction.SAVE)" class="btn-primary">
        <i class="bi bi-folder" aria-hidden="true"></i>
        Salva in Cartella
      </button>
    </div>
  `,
  styles: [
    `
      .toolbar-actions {
        display: flex;
        gap: 0.5rem;
      }
      .btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
    `,
  ],
})
export class OutputToolbarComponent {
  context = input.required<OutputContext>();
  onActionRequested = output<OutputAction>();

  // Esponiamo l'enum per l'HTML
  OutputAction = OutputAction;

  requestAction(action: OutputAction) {
    this.onActionRequested.emit(action);
  }
}
