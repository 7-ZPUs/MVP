import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IProcessSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';
import { IntegrityClassPipe } from '../../../../services/integrity-class.pipe';
@Component({
  selector: 'app-process-result-card',
  standalone: true,
  imports: [CommonModule, IntegrityClassPipe],
  templateUrl: './process-result-card.component.html',
  styleUrls: ['./process-result-card.component.scss', '../shared-result.styles.scss'],
})
export class ProcessResultCardComponent implements ISearchResultItemComponent {
  @Input() result!: IProcessSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}
