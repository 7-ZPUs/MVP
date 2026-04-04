import { InjectionToken, Signal } from '@angular/core';

export interface IOutputFacade {
  isWorking: Signal<boolean>; // True se sta esportando o stampando
  exportItem(id: string, type: 'DOCUMENT' | 'AGGREGATE'): Promise<void>;
  printItem(id: string, type: 'DOCUMENT' | 'AGGREGATE'): Promise<void>;
}

export const OUTPUT_FACADE_TOKEN = new InjectionToken<IOutputFacade>('IOutputFacade');
