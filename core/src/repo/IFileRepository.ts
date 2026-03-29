import type { File } from "../entity/File";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { ExportResult } from "../value-objects/ExportResult";
import { PrintResult } from "../value-objects/PrintResult";

export const FILE_REPOSITORY_TOKEN = Symbol("IFileRepository");

export interface IFileRepository {
  /** Restituisce un file per id, o null se non esiste. */
  getById(id: number): File | null;

  /** Restituisce tutti i file appartenenti a un documento. */
  getByDocumentId(documentId: number): File[];

  /** Restituisce tutti i file con un determinato stato di integrità. */
  getByStatus(status: IntegrityStatusEnum): File[];

  /** Persiste un nuovo file e restituisce l'entità con l'id assegnato. */
  save(file: File): File;

  /** Aggiorna lo stato di integrità di un file. */
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;

  /** Esportazione file */
  exportFile(sourcePath: string, destPath: string): Promise<ExportResult>;

  /** Stampa di un file */
  printFile(sourcePath: string): Promise<PrintResult>;
}
