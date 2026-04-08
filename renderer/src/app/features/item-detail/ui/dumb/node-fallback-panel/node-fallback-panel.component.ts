import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NodeFallbackDetail,
  NodeFallbackRelatedItem,
} from '../../../domain/node-fallback.models';

@Component({
  selector: 'app-node-fallback-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="fallback-panel" aria-live="polite">
      <header class="panel-header">
        <span class="type-badge">{{ detail().typeLabel }}</span>
        <h2>{{ detail().title }}</h2>
        <p class="subtitle">{{ detail().subtitle }}</p>
      </header>

      <dl class="field-list">
        @for (field of detail().fields; track field.label) {
          <div class="field-row">
            <dt>{{ field.label }}</dt>
            <dd>{{ field.value }}</dd>
          </div>
        }
      </dl>

      @if (detail().relatedSection; as relatedSection) {
        <section class="related-section">
          <h3>{{ relatedSection.title }}</h3>

          @if (relatedSection.items.length > 0) {
            <ul>
              @for (item of relatedSection.items; track item.itemType + ':' + item.itemId) {
                <li>
                  <button type="button" class="related-link" (click)="onRelatedItemClick(item)">
                    {{ item.label }}
                  </button>
                  @if (item.description) {
                    <span class="related-description">{{ item.description }}</span>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="empty-related">{{ relatedSection.emptyMessage }}</p>
          }
        </section>
      }

      @if (detail().hint) {
        <p class="hint">{{ detail().hint }}</p>
      }
    </section>
  `,
  styles: [
    `
      .fallback-panel {
        margin: 24px;
        padding: 20px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #ffffff;
        color: #0f172a;
      }

      .panel-header {
        margin-bottom: 18px;
      }

      .type-badge {
        display: inline-block;
        margin-bottom: 8px;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #94a3b8;
        color: #334155;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      h2 {
        margin: 0;
        font-size: 1.2rem;
      }

      .subtitle {
        margin: 6px 0 0;
        color: #475569;
      }

      .field-list {
        margin: 0;
      }

      .field-row {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      dt {
        color: #64748b;
        font-weight: 600;
      }

      dd {
        margin: 0;
        color: #0f172a;
        word-break: break-word;
      }

      .hint {
        margin: 16px 0 0;
        padding: 12px;
        border-radius: 8px;
        border: 1px dashed #cbd5e1;
        background: #f8fafc;
        color: #475569;
      }

      .related-section {
        margin-top: 16px;
      }

      .related-section h3 {
        margin: 0 0 8px;
        font-size: 0.95rem;
        color: #334155;
      }

      .related-section ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .related-link {
        border: none;
        background: transparent;
        color: #2563eb;
        text-decoration: underline;
        padding: 0;
        cursor: pointer;
        font-weight: 600;
      }

      .related-description {
        margin-left: 8px;
        color: #64748b;
        font-size: 0.85rem;
      }

      .empty-related {
        margin: 0;
        color: #64748b;
      }
    `,
  ],
})
export class NodeFallbackPanelComponent {
  detail = input.required<NodeFallbackDetail>();
  relatedItemSelected = output<NodeFallbackRelatedItem>();

  onRelatedItemClick(item: NodeFallbackRelatedItem): void {
    this.relatedItemSelected.emit(item);
  }
}