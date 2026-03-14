export enum SearchQueryType {
  FREE = 'FREE',
  CLASS = 'CLASS',
  PROCESS = 'PROCESS',
}

export enum FilterFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  ENUM = 'ENUM',
  BOOLEAN = 'BOOLEAN',
}

export enum SubjectRole {
  PRODUTTORE = 'PRODUTTORE',
  DESTINATARIO = 'DESTINATARIO',
  RESPONSABILE = 'RESPONSABILE',
}

export enum SubjectType {
  PAI = 'PAI',
  PAE = 'PAE',
  PG = 'PG',
  PF = 'PF',
  AS = 'AS',
  RUP = 'RUP',
  SW = 'SW',
}

export enum IndexingStatus {
  IDLE = 'IDLE',
  INDEXING = 'INDEXING',
  READY = 'READY',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}
