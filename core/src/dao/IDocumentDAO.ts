import { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_DAO_TOKEN = Symbol("IDocumentDAO");

export interface IDocumentDAO {
  getById(id: number): Document | null;
  getByProcessId(processId: number): Document[];
  getByStatus(status: IntegrityStatusEnum): Document[];
  save(document: Document): Document;
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
