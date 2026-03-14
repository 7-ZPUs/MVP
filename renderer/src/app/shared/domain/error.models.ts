import { ErrorCode, ErrorCategory, ErrorSeverity } from './error.enum';

export interface AppError {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  message: string;
  source: string;
  context: Record<string, any>;
  detail: string | null;
}
