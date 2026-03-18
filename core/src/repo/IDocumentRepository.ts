import { CreateDocumentDTO } from '../dto/DocumentDTO';
import type { Document } from '../entity/Document';
import { IntegrityStatusEnum } from '../value-objects/IntegrityStatusEnum';
import { SearchFilter } from '../value-objects/SearchFilter';

export const DOCUMENTO_REPOSITORY_TOKEN = Symbol('IDocumentRepository');

export interface IDocumentRepository {
    /** Restituisce un document per id, o null se non esiste. */
    getById(id: number): Document | null;

    /** Restituisce tutti i documenti appartenenti a un processo. */
    getByProcessId(processId: number): Document[];

    /** Restituisce tutti i documenti con un determinato stato di integrità. */
    getByStatus(status: IntegrityStatusEnum): Document[];

    /** Persiste un nuovo document e restituisce l'entità con l'id assegnato. */
    save(dto: CreateDocumentDTO): Document;

    /** Aggiorna lo stato di integrità di un document. */
    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;

    /** Ricerca documenti mediante metadati */
    searchDocument(filters: SearchFilter[]): Document[];
}
