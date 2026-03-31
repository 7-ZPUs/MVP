import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppError, ErrorSeverity } from '../../domain';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-dialog" [class.fatal-dialog]="isFatal()">
        <div class="modal-header">
          <span class="header-icon">{{ getIcon() }}</span>
          <h2 class="header-title">{{ getTitle() }}</h2>
        </div>

        <div class="modal-body">
          <p class="error-message">{{ error().message }}</p>

          <div class="error-meta">
            @if (error().code) {
              <p>
                <strong>Codice:</strong> <span class="mono">{{ error().code }}</span>
              </p>
            }
            @if (error().source) {
              <p><strong>Origine:</strong> {{ error().source }}</p>
            }
          </div>

          @if (error().detail) {
            <details class="tech-details">
              <summary>Dettagli tecnici</summary>
              <pre>{{ error().detail }}</pre>
            </details>
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Chiudi</button>

          @if (error().recoverable) {
            <button class="btn btn-primary" (click)="retry()">
              <span class="icon">🔄</span> Riprova
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }
      .modal-dialog {
        background: #ffffff;
        width: 100%;
        max-width: 500px;
        border-radius: 12px;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 8px 10px -6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border-top: 4px solid #f59e0b;
      }

      /* Variante stile per errori fatali */
      .modal-dialog.fatal-dialog {
        border-top-color: #ef4444;
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .header-icon {
        font-size: 1.5rem;
      }
      .header-title {
        margin: 0;
        font-size: 1.1rem;
        color: #0f172a;
        font-weight: 600;
      }

      .modal-body {
        padding: 1.5rem;
      }
      .error-message {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: #334155;
        line-height: 1.5;
      }
      .error-meta {
        background: #f1f5f9;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        color: #475569;
        margin-bottom: 1rem;
      }
      .error-meta p {
        margin: 0.25rem 0;
      }
      .mono {
        font-family: monospace;
        font-weight: 600;
        background: #e2e8f0;
        padding: 2px 4px;
        border-radius: 4px;
      }

      .tech-details {
        margin-top: 1rem;
        font-size: 0.8rem;
        color: #64748b;
      }
      .tech-details pre {
        background: #1e293b;
        color: #e2e8f0;
        padding: 1rem;
        border-radius: 6px;
        overflow-x: auto;
        margin-top: 0.5rem;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: background-color 0.2s;
      }
      .btn-secondary {
        background: #e2e8f0;
        color: #475569;
      }
      .btn-secondary:hover {
        background: #cbd5e1;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      .btn-primary:hover {
        background: #2563eb;
      }
    `,
  ],
})
export class ErrorDialogComponent {
  // Input: L'errore formattato dal nostro IpcErrorHandlerService
  error = input.required<AppError>();

  // Output: Gli eventi verso la pagina principale
  onRetry = output<void>();
  onClose = output<void>();

  isFatal(): boolean {
    return this.error().severity === ErrorSeverity.FATAL;
  }

  getIcon(): string {
    switch (this.error().severity) {
      case ErrorSeverity.WARNING:
        return '⚠️';
      case ErrorSeverity.ERROR:
        return '❌';
      case ErrorSeverity.FATAL:
        return '💀';
      default:
        return 'ℹ️';
    }
  }

  getTitle(): string {
    switch (this.error().severity) {
      case ErrorSeverity.WARNING:
        return 'Attenzione';
      case ErrorSeverity.FATAL:
        return 'Errore Critico del Sistema';
      case ErrorSeverity.ERROR:
        return 'Si è verificato un errore';
      default:
        return 'Avviso';
    }
  }

  close() {
    this.onClose.emit();
  }

  retry() {
    this.onRetry.emit();
  }
}
