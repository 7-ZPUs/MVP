import { Component, Signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { ImportFacade }              from '../../services/import.facade';
import { ImportPhase }               from '../../domain/enums';
import { DipTreeComponent }          from './dip-tree.component';
import { DocumentPreviewComponent }  from '../dumb/document-preview.component';
import { DipTreeNode }               from '../../domain/models';
 
@Component({
  selector:   'app-dip-loading-page',
  standalone: true,
  imports:    [CommonModule, DipTreeComponent, DocumentPreviewComponent],
  template: `
    <div class="import-layout">
 
      <aside class="dip-sidebar"
             role="navigation"
             aria-label="Navigazione albero DIP">
        <h2>Albero DIP</h2>
        <app-dip-tree (nodeSelected)="onNodeSelected($event)" />
      </aside>
 
      <main class="dip-main"
            role="main"
            aria-label="Contenuto documento selezionato"
            [attr.aria-busy]="loading()">
 
        @if (phase() === ImportPhase.LOADING) {
          <div role="status"
               aria-live="polite"
               aria-label="Caricamento in corso">
            <p>Caricamento in corso…</p>
          </div>
        }
 
        @if (phase() === ImportPhase.ERROR) {
          <div role="alert"
               aria-live="assertive"
               aria-atomic="true">
            <p>Impossibile caricare il DIP.</p>
            <button (click)="onRetry()"
                    aria-label="Riprova il caricamento del DIP">
              Riprova
            </button>
          </div>
        }
 
        @if (phase() === ImportPhase.READY || phase() === ImportPhase.EMPTY) {
          <app-document-preview [node]="selectedDocument()" />
        }
 
      </main>
 
    </div>
  `,
})
export class DipLoadingPageComponent {
 
  protected readonly ImportPhase = ImportPhase;
 
  readonly phase:            Signal<ImportPhase>;
  readonly selectedDocument: Signal<DipTreeNode | null>;
  readonly loading:          Signal<boolean>;
 
  constructor(private readonly facade: ImportFacade) {
    this.phase            = this.facade.phase;
    this.selectedDocument = this.facade.selectedDocument;
    this.loading          = this.facade.loading;
  }
 
  onNodeSelected(node: DipTreeNode): void {
    this.facade.selectDocument(node);
  }
 
  onRetry(): void {
    this.facade.retryLoad();
  }
}