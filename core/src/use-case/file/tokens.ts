export const FileUC = {
    GET_BY_ID: Symbol('IGetFileByIdUC'),
    GET_BY_DOCUMENT: Symbol('IGetFileByDocumentUC'),
    GET_BY_STATUS: Symbol('IGetFileByStatusUC'),
    CREATE: Symbol('ICreateFileUC'),
    EXPORT_FILE: Symbol('IExportFileUC'),
    PRINT_FILE: Symbol('IPrintFileUC'),
} as const;
