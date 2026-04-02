import { DocumentClass } from "../entity/DocumentClass";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_CLASS_DAO_TOKEN = Symbol("IDocumentClassDAO");

export interface IDocumentClassDAO {
  getById(id: number): DocumentClass | null;
  getByDipId(dipId: number): DocumentClass[];
  getByStatus(status: IntegrityStatusEnum): DocumentClass[];
  save(documentClass: DocumentClass): DocumentClass;
  search(query: string): DocumentClass[] | null;
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
