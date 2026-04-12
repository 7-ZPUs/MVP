import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IClassSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';
import { IntegrityClassPipe } from '../../../../services/integrity-class.pipe';
@Component({
  selector: 'app-class-result-card',
  standalone: true,
  imports: [CommonModule, IntegrityClassPipe],
  templateUrl: './class-result-card.component.html',
  styleUrls: ['./class-result-card.component.scss', '../shared-result.styles.scss'],
})
export class ClassResultCardComponent implements ISearchResultItemComponent {
  // Iniezione sicura: accetta solo IClassSearchResult
  @Input() result!: IClassSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}
