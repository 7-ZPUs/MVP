import { Injectable, Type } from '@angular/core';
import {
  DocumentResultCardComponent,
  AggregateResultCardComponent,
  ClassResultCardComponent,
  ProcessResultCardComponent,
} from '../ui/dumb/result-types';

import { ISearchResultItemComponent } from '../contracts/search-result-item.interface';

@Injectable({ providedIn: 'root' })
export class SearchResultFactoryService {
  private readonly componentRegistry: Record<string, Type<ISearchResultItemComponent>> = {
    DOCUMENTO_INFORMATICO: DocumentResultCardComponent,
    DOCUMENTO_AMMINISTRATIVO_INFORMATICO: DocumentResultCardComponent,
    PROCESSO: ProcessResultCardComponent,
    AGGREGAZIONE_DOCUMENTALE: AggregateResultCardComponent,
    CLASS: ClassResultCardComponent,
    CLASSE: ClassResultCardComponent,
  };

  public getComponentForType(type: string): Type<ISearchResultItemComponent> {
    if (!type) return DocumentResultCardComponent;
    return this.componentRegistry[type] || DocumentResultCardComponent;
  }
}
