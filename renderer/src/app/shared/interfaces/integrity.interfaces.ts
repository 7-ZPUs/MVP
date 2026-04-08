import { InjectionToken, Signal } from '@angular/core';

export interface IIntegrityFacade {
  isVerifying: Signal<boolean>;
  verifyItem(itemId: string, itemType: 'DOCUMENT' | 'AGGREGATE' | 'PROCESS'): Promise<string>;
}

export const INTEGRITY_FACADE_TOKEN = new InjectionToken<IIntegrityFacade>('IIntegrityFacade');
