/**
 * ClasseDocumentale — Domain Entity.
 *
 * Rappresenta una classe documentale con un identificatore univoco, nome e cognome.
 * È un oggetto puramente di dominio: zero dipendenze esterne.
 */
export interface ClasseDocumentale {
    /** Chiave primaria auto-incrementale generata dal DB. */
    id: number;
    nome: string;
}
