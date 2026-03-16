import { ErrorCode } from '../domain/error.enum';
import { AppError } from '../domain/error.models';

export interface IErrorHandler {
  handle(raw: unknown): AppError;
  createError(code: ErrorCode, message: string, source: string): AppError;
}
