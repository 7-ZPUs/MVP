import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="empty-state-container"
      style="padding: 2rem; text-align: center; color: #64748b; background: #f8fafc; border-radius: 8px;"
    >
      <p class="empty-message">{{ message }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() message: string = 'Nessun dato presente.';
}
