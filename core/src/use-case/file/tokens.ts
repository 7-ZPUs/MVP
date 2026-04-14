export const FileUC = {
  GET_BY_ID: Symbol("IGetFileByIdUC"),
  GET_BY_DOCUMENT: Symbol("IGetFileByDocumentUC"),
  GET_BY_STATUS: Symbol("IGetFileByStatusUC"),
  CREATE: Symbol("ICreateFileUC"),
  CHECK_INTEGRITY_STATUS: Symbol("ICheckFileIntegrityStatusUC"),
  EXPORT_FILE: Symbol("IExportFileUC"),
  EXPORT_FILES: Symbol("IExportFilesUC"),
  GET_CONTENT: Symbol("IGetFileContentUC"),
  PRINT_FILE: Symbol("IPrintFileUC"),
  PRINT_FILES: Symbol("IPrintFilesUC")
} as const;
