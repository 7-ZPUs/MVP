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
  templateUrl: './integrity-corrupted-panel.component.html',
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
