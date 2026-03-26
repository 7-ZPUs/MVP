import { InjectionToken, Signal } from '@angular/core';
import { ItemDetailVM, ItemDetailType } from '../domain/detail.view-models';

export interface IItemDetailFacade {
  item: Signal<ItemDetailVM | null>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  loadItem(id: string, type: ItemDetailType): Promise<void>;
}

export const ITEM_DETAIL_FACADE_TOKEN = new InjectionToken<IItemDetailFacade>('IItemDetailFacade');
