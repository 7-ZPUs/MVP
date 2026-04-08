import { InjectionToken, Signal } from '@angular/core';
import { ProcessState } from '../domain/process.models';

export interface IProcessFacade {
  getState(): Signal<ProcessState>;
  loadProcess(id: string): Promise<void>;
  isProcess(id: string): Promise<boolean>;
}

export const PROCESS_FACADE_TOKEN = new InjectionToken<IProcessFacade>('IProcessFacade');
