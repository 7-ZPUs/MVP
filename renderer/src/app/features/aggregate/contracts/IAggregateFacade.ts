import { InjectionToken, Signal } from '@angular/core';
import { AggregateState } from '../domain/aggregate.models';

export interface IAggregateFacade {
  getState(): Signal<AggregateState>;
  loadAggregate(id: string): void;
}

export const AGGREGATE_FACADE_TOKEN = new InjectionToken<IAggregateFacade>('IAggregateFacade');
