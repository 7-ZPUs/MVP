import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../../../../shared/ui/dumb/empty-state.component/empty-state.component';
import { ISearchResult } from '../../../../../../../../shared/domain/metadata/search-result.models';
import { ExportPageComponent } from '../../../../export-manager/ui/smart/export-page/export-page.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, ExportPageComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
})
export class SearchResultsComponent {
  @Input() results: ISearchResult[] = [];
  @Input() emptyMessage: string = 'Nessun risultato trovato per la ricerca corrente.';
  @Input() isSemanticSearch: boolean = false;

  @Output() resultSelected = new EventEmitter<ISearchResult>();

  public onSelect(selectedResult: ISearchResult): void {
    this.resultSelected.emit(selectedResult);
  }

  public onExport(documentId: string): void {}
  public onPrint(documentId: string): void {}
}
