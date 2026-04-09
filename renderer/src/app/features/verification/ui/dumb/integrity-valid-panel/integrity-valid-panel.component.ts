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
  templateUrl: './integrity-valid-panel.component.html',
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
