import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppError } from '../../../../../shared/domain';

@Component({
  selector: 'app-async-state-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './async-state-wrapper.component.html',
})
export class AsyncStateWrapperComponent {
  @Input() isLoading: boolean = false;
  @Input() error: AppError | null = null;

  // Testi personalizzabili
  @Input() loadingMessage: string = 'Caricamento in corso...';
  @Input() fallbackErrorMessage: string = 'Si è verificato un errore imprevisto.';

  @Output() retry = new EventEmitter<void>();

  public onRetry(): void {
    this.retry.emit();
  }
}
