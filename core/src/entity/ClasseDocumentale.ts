import { Metadato } from "../value-objects/Metadato";
import { StatoVerificaEnum } from "../value-objects/StatoVerificaEnum";

/**
 * ClasseDocumentale — Domain Entity.
 *
 * Rappresenta una classe documentale con un identificatore univoco, nome e cognome.
 * È un oggetto puramente di dominio: zero dipendenze esterne.
 */
export interface ClasseDocumentale {
    /** Chiave primaria auto-incrementale generata dal DB. */
    id: number;
    uuid: string;
    nome: string;
    metadati?: Metadato[];
    stato?: StatoVerificaEnum;
    hash?: string;
}


