import { Component, computed, input } from '@angular/core';
import { IntegrityNodeVM } from '../../../domain/integrity.view-models';
import { IntegrityStatusEnum } from '../../../../../shared/domain/value-objects/IntegrityStatusEnum';

interface ProcessErrorGroup {
  processName: string;
  processKey: string;
  documents: IntegrityNodeVM[];
}

interface ClassErrorGroup {
  className: string;
  processes: ProcessErrorGroup[];
  totalDocuments: number;
}

@Component({
  selector: 'app-integrity-valid-panel',
  standalone: true,
  template: `
    @if (classNodes().length > 0) {
      <section class="valid-container" aria-labelledby="valid-heading">
        <header class="panel-header">
          <h3 id="valid-heading">
            <i class="bi bi-folder" aria-hidden="true"></i>
            Classi Analizzate
          </h3>
          <p>Le classi non valide includono il dettaglio di processo e documento che le invalida.</p>
        </header>

        <ul class="list-container" aria-label="Elenco delle classi analizzate">
          @for (classNode of classNodes(); track classNode.id) {
            <li class="valid-row">
              @if (classNode.status === 'INVALID') {
                @let invalidClass = groupedErrors().get(classNode.name);
                @if (invalidClass) {
                  <details class="error-group class-group" [open]="true">
                    <summary>
                      <span class="summary-main">
                        <span class="summary-label summary-label--class">Classe</span>
                        <strong class="summary-name">{{ classNode.name }}</strong>
                      </span>
                      <span class="class-summary-right">
                        <span
                          [class]="getStatusClass(classNode.status)"
                          [attr.aria-label]="'Stato: ' + getStatusLabel(classNode.status)"
                        >
                          {{ getStatusLabel(classNode.status) }}
                        </span>
                        <span class="summary-count">{{ invalidClass.totalDocuments }} documento/i</span>
                      </span>
                    </summary>

                    <ul class="process-list">
                      @for (processGroup of invalidClass.processes; track processGroup.processKey; let processFirst = $first) {
                        <li>
                          <details class="error-group process-group" [open]="processFirst && invalidClass.totalDocuments <= 3">
                            <summary>
                              <span class="summary-main">
                                <span class="summary-label summary-label--process">Processo</span>
                                <strong class="summary-name">{{ processGroup.processName }}</strong>
                              </span>
                              <span class="summary-count">{{ processGroup.documents.length }} documento/i</span>
                            </summary>

                            <ul class="document-list">
                              @for (node of processGroup.documents; track node.id) {
                                <li class="document-row">
                                  <span class="type-indicator" [class]="node.type.toLowerCase()">
                                    <span class="sr-only">Tipo: </span>{{ formatType(node.type) }}
                                  </span>
                                  <strong class="node-name">{{ node.name }}</strong>
                                </li>
                              }
                            </ul>
                          </details>
                        </li>
                      }
                    </ul>
                  </details>
                }
              } @else {
                <div class="row-top">
                  <div class="row-left">
                    <span class="type-indicator class">
                      <span class="sr-only">Tipo: </span>Classe
                    </span>
                    <strong class="node-name">{{ classNode.name }}</strong>
                  </div>

                  <div class="row-right">
                    <span
                      [class]="getStatusClass(classNode.status)"
                      [attr.aria-label]="'Stato: ' + getStatusLabel(classNode.status)"
                    >
                      {{ getStatusLabel(classNode.status) }}
                    </span>
                  </div>
                </div>
              }
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
  corruptedNodes = input<IntegrityNodeVM[]>([]);

  classNodes = computed(() =>
    [...this.nodes().filter((node) => node.type === 'CLASS')].sort((left, right) => {
      if (left.status === right.status) {
        return left.name.localeCompare(right.name);
      }

      if (left.status === IntegrityStatusEnum.INVALID) {
        return -1;
      }

      if (right.status === IntegrityStatusEnum.INVALID) {
        return 1;
      }

      return 0;
    }),
  );
  groupedErrors = computed<Map<string, ClassErrorGroup>>(() => this.groupNodesByContext(this.corruptedNodes()));

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

  private groupNodesByContext(nodes: IntegrityNodeVM[]): Map<string, ClassErrorGroup> {
    const classes = new Map<string, Map<string, IntegrityNodeVM[]>>();

    for (const node of nodes) {
      const context = this.parseContextPath(node.contextPath);
      const classMap = classes.get(context.className) ?? new Map<string, IntegrityNodeVM[]>();
      const documents = classMap.get(context.processName) ?? [];
      documents.push(node);
      classMap.set(context.processName, documents);
      classes.set(context.className, classMap);
    }

    return new Map(
      Array.from(classes.entries()).map(([className, processMap]) => {
      const processes = Array.from(processMap.entries()).map(([processName, documents]) => ({
        processName,
        processKey: `${className}::${processName}`,
        documents,
      }));

        return [
          className,
          {
            className,
            processes,
            totalDocuments: processes.reduce((acc, process) => acc + process.documents.length, 0),
          },
        ] as const;
      }),
    );
  }

  private parseContextPath(contextPath?: string): { className: string; processName: string } {
    if (!contextPath) {
      return { className: 'Classe non disponibile', processName: 'Processo non disponibile' };
    }

    const classMatch = /Classe:\s*([^|>]+)/i.exec(contextPath);
    const processMatch = /Processo:\s*([^|>]+)/i.exec(contextPath);
    if (classMatch && processMatch) {
      return {
        className: classMatch[1].trim(),
        processName: processMatch[1].trim(),
      };
    }

    const parts = contextPath.split('>').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { className: parts[0], processName: parts[1] };
    }

    return { className: contextPath.trim(), processName: 'Processo non disponibile' };
  }
}
