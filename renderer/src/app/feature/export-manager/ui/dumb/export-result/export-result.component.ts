import {
  Component, EventEmitter, Output,
  ChangeDetectionStrategy, input, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportResult, ExportError } from '../../../domain/models';
import { ExportPhase, OutputContext } from '../../../domain/enums';

@Component({
  selector: 'app-export-result',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-result.component.html',
  styleUrl: './export-result.component.scss',
})
export class ExportResultComponent {
  readonly phase  = input<ExportPhase>(ExportPhase.IDLE);
  readonly result = input<ExportResult | null>(null);
  readonly error  = input<ExportError  | null>(null);

  @Output() retry = new EventEmitter<void>();

  protected readonly ExportPhase = ExportPhase;

  readonly successMessage = computed((): string => {
    const r = this.result();
    if (!r) return '';
    switch (r.outputContext) {
      case OutputContext.SINGLE_EXPORT: return 'Documento salvato con successo';
      case OutputContext.MULTI_EXPORT:  return `${r.successCount} documenti salvati`;
      case OutputContext.SINGLE_PRINT:  return 'Documento aperto con lettore predefinito';
      case OutputContext.MULTI_PRINT:   return `${r.successCount} documenti aperti con lettore predefinito`;
      case OutputContext.REPORT_PDF:    return 'Report PDF esportato con successo';
      default:                          return 'Operazione completata';
    }
  });
}