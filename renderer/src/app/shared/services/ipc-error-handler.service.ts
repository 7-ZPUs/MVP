import { Injectable } from '@angular/core';
import { IErrorHandler } from '../contracts/error-handler.interface';
import { AppError, ErrorCode, ErrorCategory, ErrorSeverity } from '../domain';

@Injectable({ providedIn: 'root' })
export class IpcErrorHandlerService implements IErrorHandler {
  private readonly errorMap: Record<
    ErrorCode,
    { category: ErrorCategory; severity: ErrorSeverity; recoverable: boolean }
  > = {
    [ErrorCode.VALIDATION_ERROR]: {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      recoverable: true,
    },
    [ErrorCode.SEARCH_ENGINE_ERROR]: {
      category: ErrorCategory.DOMAIN,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
    },
    [ErrorCode.IPC_ERROR]: {
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.FATAL,
      recoverable: false,
    },
    [ErrorCode.DOC_FORMAT_UNSUPPORTED]: {
      category: ErrorCategory.IO,
      severity: ErrorSeverity.WARNING,
      recoverable: false,
    },
    [ErrorCode.DOC_BLOB_LOAD_ERROR]: {
      category: ErrorCategory.IO,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
    },
    [ErrorCode.DIP_CORRUPT_ARCHIVE]: {
      category: ErrorCategory.DOMAIN,
      severity: ErrorSeverity.FATAL,
      recoverable: false,
    },
    [ErrorCode.DIP_PARSE_ERROR]: {
      category: ErrorCategory.DOMAIN,
      severity: ErrorSeverity.ERROR,
      recoverable: false,
    },
    [ErrorCode.DIP_INDEX_ERROR]: {
      category: ErrorCategory.DOMAIN,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
    },
  };

  public handle(raw: unknown): AppError {
    const code = this.toErrorCode(raw);

    let message: string;
    if (raw instanceof Error) {
      message = raw.message;
    } else if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      message = String((raw as any).message);
    } else {
      message = String(raw);
    }

    const source = (raw as any)?.source || 'IPC Gateway';
    const context = (raw as any)?.context || null;
    const detail = raw instanceof Error ? raw.stack || null : null;

    const errorObj = this.createError(code, message, source);
    errorObj.context = context;
    errorObj.detail = detail;

    return errorObj;
  }

  public createError(code: ErrorCode, message: string, source: string): AppError {
    const config = this.errorMap[code] || {
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.ERROR,
      recoverable: false,
    };

    return {
      code,
      message,
      source,
      category: config.category,
      severity: config.severity,
      recoverable: config.recoverable,
      context: null,
      detail: null,
    };
  }

  private toErrorCode(raw: unknown): ErrorCode {
    if (typeof raw === 'object' && raw !== null && 'code' in raw) {
      const extractedCode = (raw as any).code;
      if (Object.values(ErrorCode).includes(extractedCode)) {
        return extractedCode as ErrorCode;
      }
    }

    if (raw instanceof Error && raw.message.toLowerCase().includes('ipc')) {
      return ErrorCode.IPC_ERROR;
    }

    return ErrorCode.SEARCH_ENGINE_ERROR;
  }
}
