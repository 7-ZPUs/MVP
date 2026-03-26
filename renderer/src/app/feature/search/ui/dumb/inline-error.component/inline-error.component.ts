import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inline-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="inline-error"
      style="color: #dc2626; background: #fef2f2; padding: 0.5rem; border-radius: 4px; border: 1px solid #fee2e2; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;"
    >
      <span class="error-icon">⚠️</span>
      <span class="error-message">{{ message }}</span>
    </div>
  `,
})
export class InlineErrorComponent {
  @Input() message: string = 'Si è verificato un errore.';
}
