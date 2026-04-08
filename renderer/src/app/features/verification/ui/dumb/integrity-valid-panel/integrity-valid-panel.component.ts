import { Component, input } from '@angular/core';
import { IntegrityNodeVM } from '../../../domain/integrity.view-models';

@Component({
  selector: 'app-integrity-valid-panel',
  standalone: true,
  template: `
    @if (nodes().length > 0) {
      <section class="valid-container" aria-labelledby="valid-heading">
        <header class="panel-header">
          <h3 id="valid-heading">
            <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            Elementi Analizzati e Verificati
          </h3>
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
  styleUrl: './integrity-valid-panel.component.scss',
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
