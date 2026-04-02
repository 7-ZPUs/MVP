import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportFacade } from '../../../services/import.facade';
import { ImportPhase } from '../../../domain/enums';
import { DipTreeComponent } from '../dip-tree/dip-tree.component';
import { DocumentPreviewComponent } from '../../dumb/document-preview/document-preview.component';
import { DipTreeNode } from '../../../domain/models';

@Component({
  selector: 'app-dip-loading-page',
  standalone: true,
  imports: [CommonModule, DipTreeComponent, DocumentPreviewComponent],
  templateUrl: './dip-loading-page.component.html',
  styleUrls: ['./dip-loading-page.component.scss']
})
export class DipLoadingPageComponent {
  protected readonly ImportPhase = ImportPhase;

  readonly phase: Signal<ImportPhase>;
  readonly selectedDocument: Signal<DipTreeNode | null>;
  readonly loading: Signal<boolean>;

  constructor(private readonly facade: ImportFacade) {
    this.phase = this.facade.phase;
    this.selectedDocument = this.facade.selectedDocument;
    this.loading = this.facade.loading;
  }

  onNodeSelected(node: DipTreeNode): void {
    this.facade.selectDocument(node);
  }

  onRetry(): void {
    this.facade.retryLoad();
  }
}