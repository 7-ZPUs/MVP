export const DocumentoUC = {
    GET_BY_ID: Symbol('IGetDocumentByIdUC'),
    GET_BY_PROCESS: Symbol('IGetDocumentByProcessUC'),
    GET_BY_STATUS: Symbol('IGetDocumentByStatusUC'),
    CREATE: Symbol('ICreateDocumentUC'),
    SEARCH_BY_FILTERS: Symbol('ISearchDocumentsUC'),
    SEARCH_SEMANTIC: Symbol('ISearchSemanticUC'),
} as const;
