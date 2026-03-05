/**
 * Inbound port: IPersonaUseCase
 *
 * Espone i casi d'uso CRUD per la Persona.
 * L'IPC adapter conosce SOLO questa interfaccia — mai l'Application Service concreto.
 */
import type { Persona } from '../../entities/Persona';

export const PERSONA_USE_CASE_TOKEN = Symbol('IPersonaUseCase');

export interface IPersonaUseCase {
    listAll(): Persona[];
    getById(id: number): Persona | undefined;
    create(nome: string, cognome: string): Persona;
    update(id: number, nome: string, cognome: string): Persona | undefined;
    delete(id: number): boolean;
}
