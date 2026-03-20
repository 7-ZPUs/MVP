import { DocumentClass } from "../../entity/DocumentClass";

export interface ICreateDocumentClassUC {
  execute(documentClass: DocumentClass): DocumentClass;
}
