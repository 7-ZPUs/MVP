import { Component, input } from '@angular/core';
import { AttachmentData } from '../../domain/document.models';

@Component({
  selector: 'app-attachments',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Allegati</h3>
      <div class="data-row">
        <span class="label">Numero Allegati:</span> <span class="value">{{ data().numero }}</span>
      </div>

      @if (!data().allegati || data().allegati!.length === 0) {
        <p class="empty-message">Nessun dettaglio allegato presente.</p>
      } @else {
        <ul class="attachment-list">
          @for (allegato of data().allegati; track allegato.id) {
            <li class="attachment-item">
              <span class="attachment-id">{{ allegato.id }}</span>
              <span class="attachment-desc">{{ allegato.descrizione }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .metadata-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }
      .data-row {
        display: flex;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .label {
        font-weight: 600;
        color: #64748b;
        width: 140px;
        flex-shrink: 0;
      }
      .value {
        color: #1e293b;
        font-weight: 500;
      }
      .empty-message {
        color: #64748b;
        font-style: italic;
        font-size: 0.9rem;
        margin-top: 0.5rem;
      }
      .attachment-list {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0 0;
      }
      .attachment-item {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
      .attachment-id {
        font-size: 0.8rem;
        color: #64748b;
        font-family: monospace;
      }
      .attachment-desc {
        font-size: 0.95rem;
        color: #1e293b;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class AttachmentsComponent {
  data = input.required<AttachmentData>();
}
