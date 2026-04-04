import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IClassSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';
@Component({
  selector: 'app-class-result-card',
  standalone: true,
  imports: [CommonModule],
  template: ``,
  styles: [``],
})
export class ClassResultCardComponent implements ISearchResultItemComponent {
  // Iniezione sicura: accetta solo IClassSearchResult
  @Input() result!: IClassSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}
