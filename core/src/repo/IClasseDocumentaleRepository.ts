/**
 * Outbound port: IClasseDocumentaleRepository
 *
 * Definisce il contratto che ogni adapter di persistenza (SQLite, in-memory, …)
 * deve rispettare. L'Application Service conosce SOLO questa interfaccia —
 * mai la classe concreta.
 */
import type { ClasseDocumentale } from '../entity/ClasseDocumentale';
import { StatoVerificaEnum } from '../value-objects/StatoVerificaEnum';

export const CLASSE_DOCUMENTALE_REPOSITORY_TOKEN = Symbol('IClasseDocumentaleRepository');

export interface IClasseDocumentaleRepository {
    /** Restituisce tutte le classi documentali presenti nel db. */
    getAll(): ClasseDocumentale[]; //da sostituire a tempo debito con search appena capiremo come gestire i filtri

    /** Restituisce una classe documentale per id, o undefined se non esiste. */
    getById(id: number): ClasseDocumentale | undefined;

    /** Crea una nuova classe documentale e restituisce l'entità salvata (id incluso). */
    create(nome: string, uuid: string): ClasseDocumentale;

    getByStatus(stato: StatoVerificaEnum): ClasseDocumentale[];
}
