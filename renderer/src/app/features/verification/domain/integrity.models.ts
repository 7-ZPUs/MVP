// features/verification/domain/integrity.models.ts

export enum VerifyLevel {
  DIP = 'DIP',
  CLASS = 'CLASS',
  PROCESS = 'PROCESS',
  DOCUMENT = 'DOCUMENT',
}

export interface IntegrityResult {
  documentId: string;
  documentName: string;
  status: 'VALID' | 'INVALID' | 'UNKNOWN';
  timestamp: string; // ISO String
}

export interface IntegrityReport {
  level: VerifyLevel;
  targetId: string;
  timestamp: string;
  totalChecked: number;
  totalValid: number;
  totalInvalid: number;
  totalUnknown: number;
  results: IntegrityResult[];
}