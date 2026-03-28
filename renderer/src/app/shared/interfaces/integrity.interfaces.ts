import { InjectionToken, Signal } from '@angular/core';

export interface IIntegrityFacade {
  isVerifying: Signal<boolean>;
  verifyDocument(documentId: string): Promise<void>;
}

export const INTEGRITY_FACADE_TOKEN = new InjectionToken<IIntegrityFacade>('IIntegrityFacade');
