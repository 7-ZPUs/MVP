import type { Documento } from '../entity/Document';
import { IntegrityStatusEnum } from '../value-objects/IntegrityStatusEnum';

export const DOCUMENTO_REPOSITORY_TOKEN = Symbol('IDocumentoRepository');

export interface IDocumentoRepository {
    /** Restituisce un documento per id, o null se non esiste. */
    getById(id: number): Documento | null;

    /** Restituisce tutti i documenti appartenenti a un processo. */
    getByProcessId(processId: number): Documento[];

    /** Restituisce tutti i documenti con un determinato stato di integrità. */
    getByStatus(status: IntegrityStatusEnum): Documento[];

    /** Persiste un nuovo documento e restituisce l'entità con l'id assegnato. */
    save(documento: Documento): Documento;

    /** Aggiorna lo stato di integrità di un documento. */
    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
