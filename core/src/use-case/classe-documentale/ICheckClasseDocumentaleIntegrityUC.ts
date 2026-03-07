import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface ICheckClasseDocumentaleIntegrityUC {
    /**
     * Verifica l'integrità della ClasseDocumentale con l'id fornito.
     * Calcola l'hash SHA-256 dei dati serializzati e lo confronta
     * con l'hash atteso memorizzato nel repository.
     *
     * @returns L'entità aggiornata con il campo `stato` valorizzato,
     *          o `undefined` se l'entità non esiste.
     */
    execute(id: number): Promise<ClasseDocumentale | undefined>;
}
