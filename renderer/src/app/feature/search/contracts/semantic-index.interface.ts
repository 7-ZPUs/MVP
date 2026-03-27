import { InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { SemanticIndexState } from '../../../../../../shared/metadata/semantic-filter-models';

export interface ISemanticIndexStatus {
  getStatus(): Signal<SemanticIndexState>;
}

export interface IIndexingChannel {
  getIndexingStatus(): Observable<SemanticIndexState>;
}

export const INDEXING_CHANNEL_TOKEN = new InjectionToken<IIndexingChannel>('IIndexingChannel');
