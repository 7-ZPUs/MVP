/**
 * Tokens DI per gli use case di ClasseDocumentale.
 * Import singolo per accedere a tutti i token dell'entità.
 */
export const ClasseDocumentaleUC = {
    GET_ALL: Symbol('IGetAllClasseDocumentaleUC'),
    GET_BY_ID: Symbol('IGetClasseDocumentaleByIdUC'),
    CREATE: Symbol('ICreateClasseDocumentaleUC'),
    GET_BY_STATUS: Symbol('IGetClasseDocumentaleByStatusUC'),
    CHECK_INTEGRITY: Symbol('ICheckClasseDocumentaleIntegrityUC'),
};
