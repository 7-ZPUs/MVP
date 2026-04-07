import { Component, input } from '@angular/core';
import { IntegrityNodeVM } from '../../../domain/integrity.view-models';

@Component({
  selector: 'app-integrity-corrupted-panel',
  standalone: true,
  template: `
    @if (nodes().length > 0) {
      <section class="alert-container" aria-labelledby="alert-heading" role="alert">
        <header class="alert-header">
          <div class="alert-title">
            <span class="pulse-icon" aria-hidden="true">🔴</span>
            <h3 id="alert-heading">Rilevate Anomalie di Integrità ({{ nodes().length }})</h3>
          </div>
          <p>
            I seguenti elementi presentano un'impronta crittografica alterata e non sono validi.
          </p>
        </header>

        <ul class="alert-body" aria-label="Elenco degli elementi corrotti">
          @for (node of nodes(); track node.id) {
            <li class="corrupted-item">
              <div class="item-main">
                <span class="type-badge" [class]="node.type.toLowerCase()">
                  <span class="sr-only">Tipo: </span>{{ formatType(node.type) }}
                </span>
                <strong class="item-name">{{ node.name }}</strong>
              </div>
              <div class="item-context">
                <span aria-hidden="true">📍</span> Posizione: <span>{{ node.contextPath }}</span>
              </div>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: [
    `
      .alert-container {
        background: #fff;
        border-radius: 12px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
        overflow: hidden;
        border: 1px solid #fecaca;
      }
      .alert-header {
        background: linear-gradient(to right, #fef2f2, #fff);
        padding: 1.5rem;
        border-bottom: 1px solid #fee2e2;
      }
      .alert-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }
      .alert-title h3 {
        margin: 0;
        color: #b91c1c;
        font-size: 1.25rem;
        font-weight: 700;
      }
      .pulse-icon {
        animation: pulse 2s infinite;
        font-size: 1.2rem;
      }
      .alert-header p {
        margin: 0;
        color: #ef4444;
        font-size: 0.95rem;
      }

      .alert-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: #fff;
        list-style: none;
        margin: 0;
      }
      .corrupted-item {
        padding: 1rem;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #ef4444;
        border-radius: 6px;
      }
      .item-main {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }
      .item-name {
        font-size: 1.05rem;
        color: #1e293b;
      }
      .item-context {
        font-size: 0.85rem;
        color: #64748b;
        background: #f1f5f9;
        padding: 0.5rem;
        border-radius: 4px;
        display: inline-block;
      }
      .item-context span {
        font-family: 'Courier New', monospace;
        font-weight: 600;
        color: #475569;
      }

      .type-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .type-badge.class {
        background: #e0e7ff;
        color: #3730a3;
      }
      .type-badge.process {
        background: #f3e8ff;
        color: #6b21a8;
      }
      .type-badge.document {
        background: #f1f5f9;
        color: #334155;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }
    `,
  ],
})
export class IntegrityCorruptedPanelComponent {
  nodes = input.required<IntegrityNodeVM[]>();

  formatType(type: string): string {
    const map: Record<string, string> = {
      CLASS: 'Classe',
      PROCESS: 'Processo',
      DOCUMENT: 'Documento',
    };
    return map[type] || type;
  }
}
