import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../../../../shared/ui/dumb/empty-state.component/empty-state.component';
import { SearchResult } from '../../../../../../../../shared/domain/metadata';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent {
  @Input() results: SearchResult[] = [];
  @Input() emptyMessage: string = 'Nessun risultato trovato per la ricerca corrente.';
  @Input() isSemanticSearch: boolean = false;

  @Output() resultSelected = new EventEmitter<SearchResult>();

  public onSelect(selectedResult: SearchResult): void {
    this.resultSelected.emit(selectedResult);
  }
}
