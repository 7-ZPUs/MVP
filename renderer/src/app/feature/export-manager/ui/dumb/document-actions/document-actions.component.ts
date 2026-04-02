import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { DipTreeNode }   from '../../../../import/domain/models';
 
@Component({
  selector:   'app-document-actions',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="actions-bar"
         role="toolbar"
         aria-label="Azioni documento">
 
      <button class="action-btn"
              [disabled]="!hasSelection"
              [attr.aria-disabled]="!hasSelection"
              [attr.aria-label]="hasSelection ? 'Salva ' + selectionLabel : 'Salva — nessun documento selezionato'"
              (click)="onExport()">
        Salva
      </button>
 
      <button class="action-btn"
              [disabled]="!hasSelection"
              [attr.aria-disabled]="!hasSelection"
              [attr.aria-label]="hasSelection ? 'Stampa ' + selectionLabel : 'Stampa — nessun documento selezionato'"
              (click)="onPrint()">
        Stampa
      </button>
 
      @if (reportId) {
        <button class="action-btn"
                aria-label="Esporta report di verifica in PDF"
                (click)="onExportReport()">
          Esporta report PDF
        </button>
      }
 
    </div>
  `,
})
export class DocumentActionsComponent {
  @Input() selectedDocuments: DipTreeNode[] = [];
  @Input() reportId:          string | null = null;
 
  @Output() exportClicked       = new EventEmitter<DipTreeNode[]>();
  @Output() printClicked        = new EventEmitter<DipTreeNode[]>();
  @Output() exportReportClicked = new EventEmitter<string>();
 
  get hasSelection(): boolean {
    return this.selectedDocuments.length > 0;
  }
 
  get selectionLabel(): string {
    const n = this.selectedDocuments.length;
    return n === 1
      ? this.selectedDocuments[0].label
      : `${n} documenti`;
  }
 
  onExport(): void       { this.exportClicked.emit(this.selectedDocuments); }
  onPrint(): void        { this.printClicked.emit(this.selectedDocuments); }
  onExportReport(): void { if (this.reportId) this.exportReportClicked.emit(this.reportId); }
}