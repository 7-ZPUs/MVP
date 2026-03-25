import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AppError } from '../../contracts/app-error';

@Component({
  standalone: true,
  selector: 'app-inline-error',
  templateUrl: './inline-error.component.html'
})
export class InlineErrorComponent {
  @Input() error!: AppError;
  @Output() retry = new EventEmitter<void>();

  onRetry() {
    this.retry.emit();
  }
}