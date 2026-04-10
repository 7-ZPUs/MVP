import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IDocumentSearchResult,
  ISearchResult,
} from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ISearchResultItemComponent } from '../../../../contracts/search-result-item.interface';
import { IntegrityClassPipe } from '../../../../services/integrity-class.pipe';
import { ExportPageComponent } from '../../../../../export-manager/ui/smart/export-page/export-page.component';

@Component({
  selector: 'app-document-result-card',
  standalone: true,
  imports: [CommonModule, IntegrityClassPipe, ExportPageComponent],
  templateUrl: 'document-result-card.component.html',
  styleUrls: ['./document-result-card.component.scss', '../shared-result.styles.scss'],
})
export class DocumentResultCardComponent implements ISearchResultItemComponent {
  @Input() result!: IDocumentSearchResult;
  @Input() isSemanticSearch: boolean = false;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}
