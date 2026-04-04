import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IAggregateSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';

@Component({
  selector: 'app-aggregate-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aggregate-result-card.component.html',
  styleUrl: './aggregate-result-card.component.scss',
})
export class AggregateResultCardComponent implements ISearchResultItemComponent {
  @Input() result!: IAggregateSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}
