import type { Document } from "../../entity/Document";

export interface ICreateDocumentUC {
  execute(document: Document): Document;
}
