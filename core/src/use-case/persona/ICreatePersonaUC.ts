/**
 * Inbound port: ICreatePersonaUC
 *
 * Espone i casi d'uso CRUD per la Persona.
 * L'IPC adapter conosce SOLO questa interfaccia — mai l'Application Service concreto.
 */
import type { Persona } from '../../entity/Persona';

export const PERSONA_USE_CASE_TOKEN = Symbol('ICreatePersonaUC');

export interface ICreatePersonaUC {
    create(nome: string, cognome: string): Persona;
}
