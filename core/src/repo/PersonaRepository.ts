/**
 * Outbound port: IPersonaRepository
 *
 * Definisce il contratto che ogni adapter di persistenza (SQLite, in-memory, …)
 * deve rispettare. L'Application Service conosce SOLO questa interfaccia —
 * mai la classe concreta.
 */
import type { Persona } from '../entity/Persona';

export const PERSONA_REPOSITORY_TOKEN = Symbol('IPersonaRepository');

export interface IPersonaRepository {
    /** Restituisce tutte le persone presenti nel db. */
    findAll(): Persona[];

    /** Restituisce una persona per id, o undefined se non esiste. */
    findById(id: number): Persona | undefined;

    /** Crea una nuova persona e restituisce l'entità salvata (id incluso). */
    create(nome: string, cognome: string): Persona;

    /** Aggiorna nome/cognome di una persona esistente. Restituisce undefined se non trovata. */
    update(id: number, nome: string, cognome: string): Persona | undefined;

    /** Elimina una persona per id. Restituisce true se la riga esisteva. */
    delete(id: number): boolean;
}
