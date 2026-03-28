export const DocumentoUC = {
    GET_BY_ID: Symbol('IGetDocumentByIdUC'),
    GET_BY_PROCESS: Symbol('IGetDocumentByProcessUC'),
    GET_BY_STATUS: Symbol('IGetDocumentByStatusUC'),
    CREATE: Symbol('ICreateDocumentUC'),
    CHECK_INTEGRITY_STATUS: Symbol('ICheckDocumentIntegrityStatusUC'),
} as const;
