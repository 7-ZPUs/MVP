import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppError }     from '../../../domain/app-error';
 
@Component({
  selector:   'app-inline-error',
  standalone: true,
  imports:    [CommonModule],
  template: `
    @if (error) {
      <div role="alert"
           aria-live="assertive"
           aria-atomic="true"
           class="inline-error">
        <span>{{ error.message }}</span>
        @if (error.recoverable) {
          <button (click)="retry.emit()"
                  aria-label="Riprova l'operazione">
            Riprova
          </button>
        }
      </div>
    }
  `,
})
export class InlineErrorComponent {
  @Input()  error: AppError | null = null;
  @Output() retry = new EventEmitter<void>();
}