import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { OutputContext }    from '../../domain/enums';
 
@Component({
  selector:   'app-export-progress',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="progress-wrap"
         role="status"
         aria-live="polite"
         aria-atomic="false"
         [attr.aria-label]="label + ' ' + progress + '%'">
 
      <div class="progress-header">
        <span class="progress-label">{{ label }}</span>
        <span class="progress-pct" aria-hidden="true">{{ progress }}%</span>
      </div>
 
      <div class="progress-bar-bg"
           role="progressbar"
           [attr.aria-valuenow]="progress"
           aria-valuemin="0"
           aria-valuemax="100"
           [attr.aria-label]="label">
        <div class="progress-bar-fill" [style.width.%]="progress"></div>
      </div>
 
    </div>
  `,
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