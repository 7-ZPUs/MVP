import { InjectionToken } from '@angular/core';
import { ErrorCode } from '../../shared/domain/error.enum';
import { AppError } from '../../shared/domain/error.models';

export interface IErrorHandler {
  handle(raw: unknown): AppError;
  createError(code: ErrorCode, message: string, source: string): AppError;
}

export const ERROR_HANDLER_TOKEN = new InjectionToken<IErrorHandler>('IErrorHandler');
