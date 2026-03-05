/**
 * Persona — Domain Entity.
 *
 * Rappresenta una persona con un identificatore univoco, nome e cognome.
 * È un oggetto puramente di dominio: zero dipendenze esterne.
 */
export interface Persona {
    /** Chiave primaria auto-incrementale generata dal DB. */
    id: number;
    nome: string;
    cognome: string;
}
