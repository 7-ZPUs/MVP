import { Component, input } from '@angular/core';
import { IntegrityNodeVM } from '../../../domain/integrity.view-models';

@Component({
  selector: 'app-integrity-valid-panel',
  standalone: true,
  template: `
    @if (nodes().length > 0) {
      <section class="valid-container" aria-labelledby="valid-heading">
        <header class="panel-header">
          <h3 id="valid-heading">✅ Elementi Analizzati e Verificati</h3>
          <p>Gli elementi raggruppati qui sotto sono intatti.</p>
        </header>

        <ul class="list-container" aria-label="Elenco degli elementi integri">
          @for (node of nodes(); track node.id) {
            <li class="valid-row">
              <div class="row-left">
                <span class="type-indicator" [class]="node.type.toLowerCase()">
                  <span class="sr-only">Tipo: </span>{{ formatType(node.type) }}
                </span>

                <div class="node-details">
                  <strong class="node-name">{{ node.name }}</strong>
                  @if (node.contextPath) {
                    <span class="node-path">Trovato in: {{ node.contextPath }}</span>
                  }
                </div>
              </div>

              <div class="row-right">
                <span class="status-pill" aria-label="Stato: Valido">Valido</span>
              </div>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: [
    `
      /* Cambiato list-container in ul e valid-row in li */
      .valid-container {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        overflow: hidden;
      }
      .panel-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        background: #fafafa;
      }
      .panel-header h3 {
        margin: 0 0 0.25rem 0;
        color: #0f172a;
        font-size: 1.15rem;
      }
      .panel-header p {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
      }

      .list-container {
        display: flex;
        flex-direction: column;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .valid-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
      }
      .valid-row:last-child {
        border-bottom: none;
      }
      .row-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .type-indicator {
        width: 90px;
        text-align: center;
        padding: 0.35rem 0;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .type-indicator.class {
        background: #e0e7ff;
        color: #3730a3;
        border: 1px solid #c7d2fe;
      }
      .type-indicator.process {
        background: #f3e8ff;
        color: #6b21a8;
        border: 1px solid #e9d5ff;
      }
      .type-indicator.document {
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
      }

      .node-details {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .node-name {
        color: #1e293b;
        font-size: 1rem;
      }
      .node-path {
        color: #94a3b8;
        font-size: 0.8rem;
      }
      .status-pill {
        background: #d1fae5;
        color: #065f46;
        padding: 0.35rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
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
    `,
  ],
})
export class IntegrityValidPanelComponent {
  /* Identico a prima */
  nodes = input.required<IntegrityNodeVM[]>();
  formatType(type: string): string {
    switch (type) {
      case 'CLASS':
        return 'Classe';
      case 'PROCESS':
        return 'Processo';
      default:
        return 'Documento';
    }
  }
}
