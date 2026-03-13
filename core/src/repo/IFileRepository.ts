import { CreateFileDTO } from '../dto/FileDTO';
import type { File } from '../entity/File';
import { IntegrityStatusEnum } from '../value-objects/IntegrityStatusEnum';

export const FILE_REPOSITORY_TOKEN = Symbol('IFileRepository');

export interface IFileRepository {
    /** Restituisce un file per id, o null se non esiste. */
    getById(id: number): File | null;

    /** Restituisce tutti i file appartenenti a un documento. */
    getByDocumentId(documentId: number): File[];

    /** Restituisce tutti i file con un determinato stato di integrità. */
    getByStatus(status: IntegrityStatusEnum): File[];

    /** Persiste un nuovo file e restituisce l'entità con l'id assegnato. */
    save(dto: CreateFileDTO): File;

    /** Aggiorna lo stato di integrità di un file. */
    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
