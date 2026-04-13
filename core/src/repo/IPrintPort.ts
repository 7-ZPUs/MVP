import { WebContentsPrintOptions } from 'electron';
import { ExportResult } from '../../../shared/domain/ExportResult';

export const PRINT_PORT_TOKEN = Symbol("IPrintPort");

export interface IPrintPort {
  printSingle(absolutePath: string, opts: WebContentsPrintOptions): Promise<ExportResult>;
}