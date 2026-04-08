import { Component, input } from '@angular/core';

@Component({
  selector: 'app-optional-field-absent',
  standalone: true,
  template: `
    <div class="absent-field-box" data-testid="optional-field-absent-box">
      <span class="icon">ℹ️</span>
      <span class="message" data-testid="optional-field-absent-message">{{ message() }}</span>
    </div>
  `,
  styles: [
    `
      .absent-field-box {
        padding: 1rem;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 6px;
        color: #64748b;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .icon {
        font-size: 1.2rem;
      }
      .message {
        font-weight: 500;
        font-style: italic;
      }
    `,
  ],
})
export class OptionalFieldAbsentComponent {
  message = input.required<string>();
}
