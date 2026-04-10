import { Component, EventEmitter, Input, Output, inject, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../../../../shared/ui/dumb/empty-state.component/empty-state.component';
import { ISearchResult } from '../../../../../../../../shared/domain/metadata/search-result.models';
import { SearchResultFactoryService } from '../../../services/search-result-factory.service';
import { ISearchResultItemComponent } from '../../../contracts/search-result-item.interface';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
})
export class SearchResultsComponent {
  @Input() results: ISearchResult[] = [];
  @Input() emptyMessage: string = 'Nessun risultato trovato per la ricerca corrente.';
  @Input() isSemanticSearch: boolean = false;

  @Output() resultSelected = new EventEmitter<ISearchResult>();

  private factory = inject(SearchResultFactoryService);

  public getComponent(result: ISearchResult): Type<ISearchResultItemComponent> {
    return this.factory.getComponentForType(result.type);
  }

  public getInputs(result: ISearchResult): Record<string, unknown> {
    return {
      result,
      isSemanticSearch: this.isSemanticSearch,
      onSelectAction: (res: ISearchResult) => this.resultSelected.emit(res),
    };
  }

  public onExport(documentId: string): void {}
  public onPrint(documentId: string): void {}
}
