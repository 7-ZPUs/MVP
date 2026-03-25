import { Signal } from '@angular/core';
import { IntegrityReport } from '../domain/integrity.models';

export interface IIntegrityFacade {
  // Stato (Signals esposti in sola lettura)
  isVerifying: Signal<boolean>;
  currentReport: Signal<IntegrityReport | null>;
  error: Signal<string | null>;

  // Azioni
  verifyDip(): Promise<void>;
  verifyClass(classId: string): Promise<void>;
  verifyProcess(processId: string): Promise<void>;
  verifyDocument(documentId: string): Promise<void>;
  clearReport(): void;
}
