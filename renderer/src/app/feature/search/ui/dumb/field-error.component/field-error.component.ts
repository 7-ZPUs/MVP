import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidationError } from '../../../../../shared/domain/metadata';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="errors && errors.length > 0"
      class="field-errors-container"
      style="margin-top: 0.25rem;"
    >
      <div
        *ngFor="let error of errors"
        class="field-error-text"
        style="color: #dc2626; font-size: 0.75rem;"
      >
        {{ error.message }}
      </div>
    </div>
  `,
})
export class FieldErrorComponent {
  @Input() errors: ValidationError[] | null = [];
}
