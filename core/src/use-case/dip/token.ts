export const DipUC = {
    CREATE: Symbol('ICreateDipUC'),
    GET_BY_ID: Symbol('IGetDipByIdUC'),
    GET_BY_STATUS: Symbol('IGetDipByStatusUC'),
    CHECK_INTEGRITY_STATUS: Symbol('ICheckDipIntegrityStatusUC'),
} as const 