import { File } from "../entity/File";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const FILE_DAO_TOKEN = Symbol("IFileDAO");

export interface IFileDAO {
  getById(id: number): File | null;
  getByDocumentId(documentId: number): File[];
  getByStatus(status: IntegrityStatusEnum): File[];
  save(file: File): File;
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
