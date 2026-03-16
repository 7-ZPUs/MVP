import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { SemanticIndexState } from '../domain/semantic-filter-models';

export interface ISemanticIndexStatus {
  getStatus(): Signal<SemanticIndexState>;
}

export interface ISemanticIndexControl {
  cancelIndexing(): void;
}

export interface IIndexingChannel {
  getIndexingStatus(): Observable<SemanticIndexState>;
}
