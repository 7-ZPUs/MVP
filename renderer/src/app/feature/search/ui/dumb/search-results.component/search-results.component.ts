import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../../../../shared/ui/dumb/empty-state.component/empty-state.component';
import { SearchResult } from '../../../../../../../../shared/metadata';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './search-results.component.html',
})
export class SearchResultsComponent {
  @Input() results: SearchResult[] = [];
  @Input() emptyMessage: string = 'Nessun risultato trovato per la ricerca corrente.';

  @Output() resultSelected = new EventEmitter<SearchResult>();

  public onSelect(selectedResult: SearchResult): void {
    this.resultSelected.emit(selectedResult);
  }
}
