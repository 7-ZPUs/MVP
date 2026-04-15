import { DocumentClass } from "../entity/DocumentClass";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_CLASS_GET_BY_ID_PORT_TOKEN = Symbol(
  "IGetDocumentClassByIdPort",
);
export const DOCUMENT_CLASS_GET_BY_DIP_ID_PORT_TOKEN = Symbol(
  "IGetDocumentClassByDipIdPort",
);
export const DOCUMENT_CLASS_GET_BY_STATUS_PORT_TOKEN = Symbol(
  "IGetDocumentClassByStatusPort",
);
export const DOCUMENT_CLASS_SAVE_PORT_TOKEN = Symbol(
  "ISaveDocumentClassPort",
);
export const DOCUMENT_CLASS_UPDATE_INTEGRITY_STATUS_PORT_TOKEN = Symbol(
  "IUpdateDocumentClassIntegrityStatusPort",
);
export const DOCUMENT_CLASS_SEARCH_PORT_TOKEN = Symbol(
  "ISearchDocumentClassPort",
);

export interface IGetDocumentClassByIdPort {
  getById(id: number): DocumentClass | null;
}

export interface IGetDocumentClassByDipIdPort {
  getByDipId(dipId: number): DocumentClass[];
}

export interface IGetDocumentClassByStatusPort {
  getByStatus(status: IntegrityStatusEnum): DocumentClass[];
}

export interface ISaveDocumentClassPort {
  save(documentClass: DocumentClass): DocumentClass;
}

export interface IUpdateDocumentClassIntegrityStatusPort {
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}

export interface ISearchDocumentClassPort {
  searchDocumentalClasses(name: string): DocumentClass[];
}
