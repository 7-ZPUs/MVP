import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ExportResult, ExportError } from '../../domain/models';
import { ExportPhase, OutputContext } from '../../domain/enums';
 
@Component({
  selector:   'app-export-result',
  standalone: true,
  imports:    [CommonModule],
  template: `
    @if (phase === ExportPhase.SUCCESS && result) {
      <div class="result-box result-success"
           role="status"
           aria-live="polite"
           aria-atomic="true"
           [attr.aria-label]="successMessage">
        <span aria-hidden="true">✓</span>
        <div class="result-body">
          <span class="result-title">{{ successMessage }}</span>
          @if (result.failedCount > 0) {
            <span class="result-sub"
                  role="alert"
                  aria-live="assertive">
              {{ result.failedCount }} elementi non salvati
            </span>
          }
        </div>
      </div>
    }
 
    @if (phase === ExportPhase.ERROR && error) {
      <div class="result-box result-error"
           role="alert"
           aria-live="assertive"
           aria-atomic="true"
           [attr.aria-label]="'Errore: ' + error.message">
        <span aria-hidden="true">✕</span>
        <div class="result-body">
          <span class="result-title">{{ error.message }}</span>
          @if (error.recoverable) {
            <button class="retry-btn"
                    aria-label="Riprova l'operazione"
                    (click)="retry.emit()">
              Riprova
            </button>
          }
        </div>
      </div>
    }
 
    @if (phase === ExportPhase.UNAVAILABLE && error) {
      <div class="result-box result-warning"
           role="status"
           aria-live="polite"
           aria-atomic="true"
           [attr.aria-label]="'Operazione non disponibile: ' + error.message">
        <span aria-hidden="true">⚠</span>
        <div class="result-body">
          <span class="result-title">{{ error.message }}</span>
        </div>
      </div>
    }
  `,
})
export class ExportResultComponent {
  @Input() phase:  ExportPhase  = ExportPhase.IDLE;
  @Input() result: ExportResult | null = null;
  @Input() error:  ExportError  | null = null;
 
  @Output() retry = new EventEmitter<void>();
 
  protected readonly ExportPhase = ExportPhase;
 
  get successMessage(): string {
    if (!this.result) return '';
    switch (this.result.outputContext) {
      case OutputContext.SINGLE_EXPORT: return 'Documento salvato con successo';
      case OutputContext.MULTI_EXPORT:  return `${this.result.successCount} documenti salvati`;
      case OutputContext.SINGLE_PRINT:  return 'Documento inviato alla stampante';
      case OutputContext.MULTI_PRINT:   return `${this.result.successCount} documenti inviati alla stampante`;
      case OutputContext.REPORT_PDF:    return 'Report PDF esportato con successo';
      default: return 'Operazione completata';
    }
  }
}