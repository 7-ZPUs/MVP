import { ErrorCode, ErrorCategory, ErrorSeverity } from './error.enum';

export interface AppErrorContext {
  [key: string]: string | number | boolean | null | undefined | AppErrorContext;
}

export interface AppError {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  message: string;
  source: string;
  context: AppErrorContext | null;
  detail: string | null;
}
