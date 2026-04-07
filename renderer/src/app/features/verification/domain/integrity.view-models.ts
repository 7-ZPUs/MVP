import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';

export interface IntegrityOverviewStats {
  validProcesses: number;
  invalidProcesses: number;
  unverifiedProcesses: number;
}

export type IntegrityNodeType = 'CLASS' | 'PROCESS' | 'DOCUMENT';

export interface IntegrityNodeVM {
  id: number;
  type: IntegrityNodeType;
  name: string;
  status: IntegrityStatusEnum;
  contextPath?: string; // Es. "Fascicoli Personale > Processo 123"
}
