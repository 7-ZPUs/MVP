import { Component, input } from '@angular/core';
import { Subject, SubjectType } from '../../domain/document.models';
import { KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [KeyValuePipe],
  template: `
    <div class="metadata-card" data-testid="subjects-card">
      <h3 data-testid="subjects-heading">Soggetti</h3>
      @if (!subjects() || subjects()!.length === 0) {
        <p class="empty-message" data-testid="subjects-empty">Nessun soggetto presente.</p>
      } @else {
        <div class="subject-grid" data-testid="subjects-grid">
          @for (subject of subjects(); track subject.ruolo + subject.tipo) {
            <div class="subject-card" [attr.data-testid]="'subject-card-' + toTestIdSuffix(subject.ruolo)">
              <div class="card-header" [attr.data-testid]="'subject-header-' + toTestIdSuffix(subject.ruolo)">
                <span class="role" data-testid="subject-role">{{ subject.ruolo }}</span>
                <span class="type-badge" data-testid="subject-type">{{ formatType(subject.tipo) }}</span>
              </div>
              <div class="card-body" [attr.data-testid]="'subject-body-' + toTestIdSuffix(subject.ruolo)">
                @for (campo of subject.campiSpecifici | keyvalue; track campo.key) {
                  <div class="data-row" [attr.data-testid]="'subject-field-' + toTestIdSuffix(subject.ruolo) + '-' + toTestIdSuffix(campo.key)">
                    <span class="label" data-testid="subject-field-label">{{ campo.key }}:</span>
                    <span class="value" data-testid="subject-field-value">{{ campo.value }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        margin-bottom: 1rem;
      }
      .metadata-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
      }
      .empty-message {
        color: #64748b;
        font-style: italic;
        font-size: 0.9rem;
      }
      .subject-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
      }
      .subject-card {
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        overflow: hidden;
      }
      .card-header {
        background: #f1f5f9;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #cbd5e1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .role {
        font-weight: 600;
        color: #0f172a;
        font-size: 0.95rem;
        word-break: break-all;
        overflow-wrap: break-word;
      }
      .type-badge {
        font-size: 0.75rem;
        background: #e2e8f0;
        color: #475569;
        padding: 0.2rem 0.5rem;
        border-radius: 9999px;
        font-weight: 500;
      }
      .card-body {
        padding: 1rem;
      }
      .data-row {
        display: flex;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        flex-wrap: wrap;
        gap: 0.25rem;
      }
      .data-row:last-child {
        margin-bottom: 0;
      }
      .label {
        font-weight: 600;
        color: #64748b;
        min-width: 120px;
        flex-shrink: 0;
      }
      .value {
        word-break: break-word;
        overflow-wrap: anywhere;
        color: #1e293b;
      }
    `,
  ],
})
export class SubjectListComponent {
  subjects = input<Subject[]>();

  formatType(tipo: SubjectType): string {
    return tipo.replaceAll('_', ' ');
  }

  toTestIdSuffix(value: string): string {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
  }
}
