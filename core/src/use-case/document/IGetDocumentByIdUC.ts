import { Document } from "../../entity/Document";

export interface IGetDocumentByIdUC {
    execute(id: number): Document | null;
}
