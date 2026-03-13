import { CreateProcessDTO } from "../dto/ProcessDTO";
import { Process } from "../entity/Process";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const PROCESS_REPOSITORY_TOKEN = Symbol('IProcessRepository');

export interface IProcessRepository {
    /** Restituisce un processo per id, o null se non esiste. */
    getById(id: number): Process | null;

    /** Restituisce tutti i processi appartenenti a una classe di documento. */
    getByDocumentClassId(documentClassId: number): Process[];

    /** Restituisce tutti i processi con un determinato stato di integrità. */
    getByStatus(status: IntegrityStatusEnum): Process[];

    /** Persiste un nuovo processo e restituisce l'entità con l'id assegnato. */
    save(dto: CreateProcessDTO): Process;

    /** Aggiorna lo stato di integrità di un processo. */
    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}