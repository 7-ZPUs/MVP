export enum ErrorCode {
  UNKNOWN              = 'UNKNOWN',
  LOAD_ROOT_FAILED     = 'LOAD_ROOT_FAILED',
  LOAD_CHILDREN_FAILED = 'LOAD_CHILDREN_FAILED',
  PREVIEW_UNAVAILABLE  = 'PREVIEW_UNAVAILABLE',
  DOWNLOAD_FAILED      = 'DOWNLOAD_FAILED',
}
 
export enum ErrorCategory {
  IPC        = 'ipc',
  VALIDATION = 'validation',
  NETWORK    = 'network',
  UNKNOWN    = 'unknown',
}
 
export class AppError {
  constructor(
    public readonly code:        ErrorCode,
    public readonly category:    ErrorCategory,
    public readonly context:     string,
    public readonly message:     string,
    public readonly recoverable: boolean,
    public readonly detail:      string = '',
  ) {}
}