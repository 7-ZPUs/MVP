import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoggettoDTO } from '../../../../shared/domain/dto/AggregateDTO';

@Component({
  selector: 'app-aggregate-subject-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metadata-card" data-testid="aggregate-subjects-card">
      <h3 data-testid="aggregate-subjects-heading">Soggetti</h3>
      @if (!subjects() || subjects()!.length === 0) {
        <p class="empty-message" data-testid="aggregate-subjects-empty">Nessun soggetto presente.</p>
      } @else {
        <div class="subject-grid" data-testid="aggregate-subjects-grid">
          @for (subject of subjects(); track subject.tipoRuolo) {
            <div class="subject-card" [attr.data-testid]="'agg-subject-card-' + toTestIdSuffix(subject.tipoRuolo)">
              <div class="card-header" [attr.data-testid]="'agg-subject-header-' + toTestIdSuffix(subject.tipoRuolo)">
                <span class="role" data-testid="agg-subject-role">{{ subject.tipoRuolo }}</span>
              </div>
              <div class="card-body" [attr.data-testid]="'agg-subject-body-' + toTestIdSuffix(subject.tipoRuolo)">
                <div class="data-row" [attr.data-testid]="'agg-subject-field-denominazione'">
                  <span class="label" data-testid="agg-subject-field-label">Denominazione:</span>
                  <span class="value" data-testid="agg-subject-field-value">{{ subject.denominazione || 'N/D' }}</span>
                </div>
                @if (subject.codiceFiscale) {
                  <div class="data-row" [attr.data-testid]="'agg-subject-field-cf'">
                    <span class="label" data-testid="agg-subject-field-label">Codice Fiscale / P.Iva:</span>
                    <span class="value" data-testid="agg-subject-field-value">{{ subject.codiceFiscale }}</span>
                  </div>
                }
                @if (subject.indirizzoDigitale) {
                  <div class="data-row" [attr.data-testid]="'agg-subject-field-pec'">
                    <span class="label" data-testid="agg-subject-field-label">Indirizzo Digitale:</span>
                    <span class="value" data-testid="agg-subject-field-value">{{ subject.indirizzoDigitale }}</span>
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
export class AggregateSubjectListComponent {
  subjects = input<SoggettoDTO[]>();

  toTestIdSuffix(value: string): string {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
  }
}
