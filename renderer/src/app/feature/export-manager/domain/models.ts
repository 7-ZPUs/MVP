import { ExportErrorCode, OutputContext } from './enums';
import { ErrorCategory } from '../../../shared/domain/app-error';
 
// -----------------------------------------------------------------------
// UC-21 UC-24 UC-37 — errore su singolo item in export multiplo
// -----------------------------------------------------------------------
export interface ExportItemError {
  nodeId:   string;
  nodeName: string;
  reason:   string;
}
 
// -----------------------------------------------------------------------
// UC-19 UC-20 UC-22 UC-23 UC-34 — esito operazione
// -----------------------------------------------------------------------
export class ExportResult {
  constructor(
    public readonly outputContext:   OutputContext,
    public readonly totalDocuments:  number,
    public readonly successCount:    number,
    public readonly failedCount:     number,
    public readonly destPath:        string,
    public readonly errors:          ExportItemError[] = [],
  ) {}
 
  get isFullSuccess(): boolean {
    return this.failedCount === 0;
  }
}
 
// -----------------------------------------------------------------------
// UC-21 UC-24 UC-25 UC-37 — errore tipizzato export
// -----------------------------------------------------------------------
export class ExportError {
  constructor(
    public readonly code:        ExportErrorCode,
    public readonly category:    ErrorCategory,
    public readonly context:     string,
    public readonly message:     string,
    public readonly recoverable: boolean,
    public readonly detail:      string = '',
  ) {}
}

export interface ExportAuditPayload {
  outputContext: OutputContext;
  nodeIds:       string[];
  destPath?:     string;
  error?:        string;
}