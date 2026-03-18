export const ProcessUC = {
    GET_BY_ID: Symbol('IGetProcessByIdUC'),
    GET_BY_DOCUMENT_CLASS: Symbol('IGetProcessByDocumentClassUC'),
    GET_BY_STATUS: Symbol('IGetProcessByStatusUC'),
    CREATE: Symbol('ICreateProcessUC'),
    SEARCH_BY_PROCESS_UUID: Symbol('ISearchProcessUC'),
} as const;
