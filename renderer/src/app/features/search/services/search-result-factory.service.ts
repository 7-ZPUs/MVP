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
    PROCESS: ProcessResultCardComponent,
    PROCESSO: ProcessResultCardComponent,
    AGGREGAZIONE_DOCUMENTALE: AggregateResultCardComponent,
    CLASS: ClassResultCardComponent,
    CLASSE: ClassResultCardComponent,
  };

  private normalizeType(type: string): string {
    return type.trim().replaceAll(/\s+/g, '_').toUpperCase();
  }

  public getComponentForType(type: string): Type<ISearchResultItemComponent> {
    if (!type) return DocumentResultCardComponent;

    const normalizedType = this.normalizeType(type);
    return this.componentRegistry[normalizedType] || DocumentResultCardComponent;
  }
}
