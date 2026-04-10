export enum ExportPhase {
  IDLE       = 'idle',
  PROCESSING = 'processing',  // UC-19 UC-20 UC-22 UC-23 UC-34
  SUCCESS    = 'success',
  ERROR      = 'error',       // UC-21 UC-24 UC-37
  UNAVAILABLE = 'unavailable' // UC-25 stampa non disponibile
}
 
export enum OutputContext {
  SINGLE_EXPORT = 'single_export',  // UC-19
  MULTI_EXPORT  = 'multi_export',   // UC-20
  SINGLE_PRINT  = 'single_print',   // UC-22
  MULTI_PRINT   = 'multi_print',    // UC-23
  REPORT_PDF    = 'report_pdf',     // UC-34
}
 
export enum ExportErrorCode {
  EXPORT_WRITE_FAILED  = 'EXPORT_WRITE_FAILED',  // UC-21
  EXPORT_PDF_FAILED    = 'EXPORT_PDF_FAILED',    // UC-37
  PRINT_FAILED         = 'PRINT_FAILED',         // UC-24
  PRINT_UNAVAILABLE    = 'PRINT_UNAVAILABLE',    // UC-25
}