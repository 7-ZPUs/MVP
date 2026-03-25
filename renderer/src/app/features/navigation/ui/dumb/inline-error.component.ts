import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AppError } from '../../contracts/app-error';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-inline-error',
  templateUrl: './inline-error.html',
  imports: [CommonModule],
})
export class InlineErrorComponent {
  @Input() error!: AppError;
  @Output() retry = new EventEmitter<void>();

  onRetry() {
    this.retry.emit();
  }
}