import { Component, computed, input } from '@angular/core';
import { IntegrityNodeVM } from '../../../domain/integrity.view-models';

interface ProcessErrorGroup {
  processName: string;
  processKey: string;
  documents: IntegrityNodeVM[];
}

interface ClassErrorGroup {
  className: string;
  classKey: string;
  processes: ProcessErrorGroup[];
  totalDocuments: number;
}

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

        <ul class="alert-body" aria-label="Elenco degli elementi corrotti raggruppati per classe e processo">
          @for (classGroup of groupedErrors(); track classGroup.classKey; let classFirst = $first) {
            <li class="corrupted-item">
              <details class="error-group class-group" [open]="classFirst || groupedErrors().length === 1">
                <summary>
                  <span class="summary-main">
                    <span class="summary-label">Classe</span>
                    <strong class="summary-name">{{ classGroup.className }}</strong>
                  </span>
                  <span class="summary-count">{{ classGroup.totalDocuments }} errore/i</span>
                </summary>

                <ul class="process-list">
                  @for (processGroup of classGroup.processes; track processGroup.processKey; let processFirst = $first) {
                    <li>
                      <details class="error-group process-group" [open]="processFirst && classGroup.totalDocuments <= 3">
                        <summary>
                          <span class="summary-main">
                            <span class="summary-label">Processo</span>
                            <strong class="summary-name">{{ processGroup.processName }}</strong>
                          </span>
                          <span class="summary-count">{{ processGroup.documents.length }} documento/i</span>
                        </summary>

                        <ul class="document-list">
                          @for (node of processGroup.documents; track node.id) {
                            <li class="document-row">
                              <span class="type-badge" [class]="node.type.toLowerCase()">
                                <span class="sr-only">Tipo: </span>{{ formatType(node.type) }}
                              </span>
                              <strong class="item-name">{{ node.name }}</strong>
                            </li>
                          }
                        </ul>
                      </details>
                    </li>
                  }
                </ul>
              </details>
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
  groupedErrors = computed<ClassErrorGroup[]>(() => this.groupNodesByContext(this.nodes()));

  formatType(type: string): string {
    const map: Record<string, string> = {
      CLASS: 'Classe',
      PROCESS: 'Processo',
      DOCUMENT: 'Documento',
    };
    return map[type] || type;
  }

  private groupNodesByContext(nodes: IntegrityNodeVM[]): ClassErrorGroup[] {
    const classes = new Map<string, Map<string, IntegrityNodeVM[]>>();

    for (const node of nodes) {
      const context = this.parseContextPath(node.contextPath);
      const classMap = classes.get(context.className) ?? new Map<string, IntegrityNodeVM[]>();
      const documents = classMap.get(context.processName) ?? [];
      documents.push(node);
      classMap.set(context.processName, documents);
      classes.set(context.className, classMap);
    }

    return Array.from(classes.entries()).map(([className, processMap]) => {
      const processes = Array.from(processMap.entries()).map(([processName, documents]) => ({
        processName,
        processKey: `${className}::${processName}`,
        documents,
      }));

      return {
        className,
        classKey: className,
        processes,
        totalDocuments: processes.reduce((acc, process) => acc + process.documents.length, 0),
      };
    });
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
