import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { OutputContext }    from '../../../domain/enums';
 
@Component({
  selector:   'app-export-progress',
  standalone: true,
  imports:    [CommonModule],
  templateUrl: './export-progress.component.html',
  styleUrl:   './export-progress.component.scss',
})
export class ExportProgressComponent {
  @Input() progress:      number              = 0;
  @Input() outputContext: OutputContext | null = null;
 
  get label(): string {
    switch (this.outputContext) {
      case OutputContext.MULTI_EXPORT: return 'Salvataggio in corso…';
      case OutputContext.MULTI_PRINT:  return 'Stampa in corso…';
      case OutputContext.REPORT_PDF:   return 'Generazione PDF…';
      default: return 'Elaborazione…';
    }
  }
}