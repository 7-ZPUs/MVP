import { InjectionToken, Signal } from '@angular/core';

export interface IIntegrityFacade {
  isVerifying: Signal<boolean>; // True se sta controllando le firme
  integrityStatus: Signal<'VALID' | 'INVALID' | 'UNKNOWN' | null>;
  verifyIntegrity(id: string, type: 'DOCUMENT' | 'AGGREGATE'): Promise<void>;
}

export const INTEGRITY_FACADE_TOKEN = new InjectionToken<IIntegrityFacade>('IIntegrityFacade');
