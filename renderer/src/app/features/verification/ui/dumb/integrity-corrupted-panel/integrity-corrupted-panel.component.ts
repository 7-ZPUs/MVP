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
            <i class="pulse-icon bi bi-exclamation-octagon-fill" aria-hidden="true"></i>
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
                <i class="bi bi-geo-alt" aria-hidden="true"></i>
                Posizione: <span>{{ node.contextPath }}</span>
              </div>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styleUrl: './integrity-corrupted-panel.component.scss',
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
