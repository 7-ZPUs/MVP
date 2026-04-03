import { Component, input, output } from '@angular/core';
import { OutputContext, OutputAction } from '../../../../shared/interfaces/output.interfaces';

@Component({
  selector: 'app-output-toolbar',
  standalone: true,
  template: `
    <div class="toolbar-actions">
      @if (context().tipo === 'DOCUMENT') {
        <button (click)="requestAction(OutputAction.PRINT)" class="btn">🖨️ Stampa</button>
        <button (click)="requestAction(OutputAction.DOWNLOAD)" class="btn">⬇️ Download</button>
        <button (click)="requestAction(OutputAction.EXPORT_PDF)" class="btn">📄 Esporta PDF</button>
      }
      <button (click)="requestAction(OutputAction.SAVE)" class="btn-primary">
        💾 Salva in Cartella
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
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
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
