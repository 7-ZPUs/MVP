export const DocumentClassUC = {
    GET_BY_DIP_ID: Symbol('IGetDocumentClassByDipIdUC'),
    GET_BY_STATUS: Symbol('IGetDocumentClassByStatusUC'),
    GET_BY_ID: Symbol('IGetDocumentClassByIdUC'),
    CREATE: Symbol('ICreateDocumentClassUC'),
    SEARCH_BY_DOCUMENTAL_CLASS_NAME: Symbol('ISearchDocumentalClassUC'),
} as const;