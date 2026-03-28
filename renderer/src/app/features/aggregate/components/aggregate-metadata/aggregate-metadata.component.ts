import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AggregateMetadata } from '../../domain/aggregate.models';

@Component({
  selector: 'app-aggregate-metadata',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metadata-card">
      <h3 class="card-title">Metadati dell'Aggregato</h3>
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
      .card-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      .sub-title {
        font-size: 0.9rem;
        color: #475569;
        margin: 1rem 0 0.5rem 0;
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
      .phases-list {
        list-style: none;
        padding: 0;
        margin: 0;
        border-left: 2px solid #cbd5e1;
        margin-left: 0.5rem;
      }
      .phase-item {
        position: relative;
        padding-left: 1rem;
        margin-bottom: 0.75rem;
        display: flex;
        flex-direction: column;
      }
      .phase-item::before {
        content: '';
        position: absolute;
        left: -5px;
        top: 6px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3b82f6;
      }
      .phase-type {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.85rem;
      }
      .phase-dates {
        color: #64748b;
        font-size: 0.8rem;
      }
      .empty-msg {
        font-style: italic;
        color: #94a3b8;
        font-size: 0.85rem;
        padding-left: 1rem;
      }
    `,
  ],
})
export class AggregateMetadataComponent {
  data = input.required<AggregateMetadata>();
}
