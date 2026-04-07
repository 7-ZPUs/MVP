import { Signal, InjectionToken } from '@angular/core';
import { DocumentClassDTO } from '../../../shared/domain/dto/indexDTO';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';
import { IntegrityNodeVM, IntegrityOverviewStats } from '../domain/integrity.view-models';

export interface IIntegrityFacade {
  // Stato (Signals esposti in sola lettura)
  isVerifying: Signal<boolean>;
  error: Signal<string | null>;
  currentDipStatus: Signal<IntegrityStatusEnum | null>;
  dipClasses: Signal<DocumentClassDTO[]>;
  overviewStats: Signal<IntegrityOverviewStats>;
  corruptedNodes: Signal<IntegrityNodeVM[]>;
  validRolledUpNodes: Signal<IntegrityNodeVM[]>;

  // Azioni
  loadOverview(dipId: number): Promise<void>;
  verifyDip(dipId: number): Promise<void>;
  clearResults(): void;
}

export const INTEGRITY_FACADE_TOKEN = new InjectionToken<IIntegrityFacade>('IIntegrityFacade');
