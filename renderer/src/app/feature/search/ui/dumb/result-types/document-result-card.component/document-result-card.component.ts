import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IDocumentSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';

@Component({
  selector: 'app-document-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'document-result-card.component.html',
  styleUrl: './document-result-card.component.scss',
})

export class DocumentResultCardComponent implements ISearchResultItemComponent {
  // Type Safety in azione: questo componente accetta solo IDocumentSearchResult!
  @Input() result!: IDocumentSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}
