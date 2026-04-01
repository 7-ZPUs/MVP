import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule }                from '@angular/common';
import { AppError } from '../../../../shared/domain/app-error';
import { InlineErrorComponent } from '../../../../shared/ui/dumb/empty-state.component/inline-error.component'; 
@Component({
  selector:   'app-async-state-wrapper',
  standalone: true,
  imports:    [CommonModule, InlineErrorComponent],
  template: `
    <div [attr.aria-busy]="loading"
         [attr.aria-live]="loading ? 'polite' : null"
         [attr.aria-label]="ariaLabel">
 
      @if (loading) {
        <div role="status" aria-label="Caricamento in corso">
          <ng-content select="[slot=loading]" />
        </div>
      } @else if (error) {
        <div role="alert" aria-live="assertive">
          <app-inline-error [error]="error" (retry)="retry.emit()" />
        </div>
      } @else if (empty) {
        <div role="status" aria-live="polite">
          <ng-content select="[slot=empty]" />
        </div>
      } @else {
        <ng-content />
      }
 
    </div>
  `,
})
export class AsyncStateWrapperComponent {
  @Input() loading = false;
  @Input() error:     AppError | null = null;
  @Input() empty    = false;
  @Input() ariaLabel: string | null   = null;
 
  @Output() retry = new EventEmitter<void>();
}