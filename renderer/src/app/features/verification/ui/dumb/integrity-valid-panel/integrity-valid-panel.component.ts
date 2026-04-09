import { Component, input } from '@angular/core';
import { IntegrityNodeVM } from '../../../domain/integrity.view-models';
import { IntegrityStatusEnum } from '../../../../../shared/domain/value-objects/IntegrityStatusEnum';

@Component({
  selector: 'app-integrity-valid-panel',
  standalone: true,
  template: `
    @if (nodes().length > 0) {
      <section class="valid-container" aria-labelledby="valid-heading">
        <header class="panel-header">
          <h3 id="valid-heading">
            <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            Elementi Analizzati
          </h3>
          <p>Gli elementi raggruppati qui sotto mostrano l'esito dell'analisi di integrità.</p>
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
                  @if (node.status === 'INVALID') {
                    <span class="node-error">
                      <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                      Errore: {{ getErrorDescription(node) }}
                    </span>
                  }
                </div>
              </div>

              <div class="row-right">
                <span
                  [class]="getStatusClass(node.status)"
                  [attr.aria-label]="'Stato: ' + getStatusLabel(node.status)"
                >
                  {{ getStatusLabel(node.status) }}
                </span>
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

  getStatusLabel(status: IntegrityStatusEnum): string {
    if (status === IntegrityStatusEnum.VALID) return 'Valido';
    if (status === IntegrityStatusEnum.INVALID) return 'Invalido';
    return 'Non verificato';
  }

  getStatusClass(status: IntegrityStatusEnum): string {
    if (status === IntegrityStatusEnum.VALID) return 'status-pill status-pill--valid';
    if (status === IntegrityStatusEnum.INVALID) return 'status-pill status-pill--invalid';
    return 'status-pill status-pill--unknown';
  }

  getErrorDescription(node: IntegrityNodeVM): string {
    if (node.type === 'CLASS') {
      return 'la classe contiene almeno un documento con impronta crittografica alterata';
    }

    if (node.type === 'PROCESS') {
      return 'il processo contiene almeno un elemento con hash non coerente';
    }

    return 'l\'impronta crittografica del documento non coincide con quella attesa';
  }
}
