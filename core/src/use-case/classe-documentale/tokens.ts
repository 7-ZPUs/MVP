/**
 * Tokens DI per gli use case di ClasseDocumentale.
 * Import singolo per accedere a tutti i token dell'entità.
 */
export const ClasseDocumentaleUC = {
    FIND_ALL: Symbol('IFindAllClasseDocumentaleUC'),
    FIND_BY_ID: Symbol('IFindByIdClasseDocumentaleUC'),
    CREATE: Symbol('ICreateClasseDocumentaleUC'),
} as const;
