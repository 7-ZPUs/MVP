import type { File } from "../entity/File";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const FILE_GET_BY_ID_PORT_TOKEN = Symbol("IGetFileByIdPort");
export const FILE_GET_BY_DOCUMENT_ID_PORT_TOKEN = Symbol(
  "IGetFileByDocumentIdPort",
);
export const FILE_GET_BY_STATUS_PORT_TOKEN = Symbol("IGetFileByStatusPort");
export const FILE_SAVE_PORT_TOKEN = Symbol("ISaveFilePort");
export const FILE_UPDATE_INTEGRITY_STATUS_PORT_TOKEN = Symbol(
  "IUpdateFileIntegrityStatusPort",
);

/** Restituisce un file per id, o null se non esiste. */
export interface IGetFileByIdPort {
  getById(id: number): File | null;
}

/** Restituisce tutti i file appartenenti a un documento. */
export interface IGetFileByDocumentIdPort {
  getByDocumentId(documentId: number): File[];
}

/** Restituisce tutti i file con un determinato stato di integrità. */
export interface IGetFileByStatusPort {
  getByStatus(status: IntegrityStatusEnum): File[];
}

/** Persiste un nuovo file e restituisce l'entità con l'id assegnato. */
export interface ISaveFilePort {
  save(file: File): File;
}

/** Aggiorna lo stato di integrità di un file. */
export interface IUpdateFileIntegrityStatusPort {
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
