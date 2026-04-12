import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IAggregateSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';
import { IntegrityClassPipe } from '../../../../services/integrity-class.pipe';

@Component({
  selector: 'app-aggregate-result-card',
  standalone: true,
  imports: [CommonModule, IntegrityClassPipe],
  templateUrl: './aggregate-result-card.component.html',
  styleUrls: ['./aggregate-result-card.component.scss', '../shared-result.styles.scss'],
})
export class AggregateResultCardComponent implements ISearchResultItemComponent {
  @Input() result!: IAggregateSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;

}