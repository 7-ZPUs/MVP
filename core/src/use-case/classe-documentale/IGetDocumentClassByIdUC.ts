import { DocumentClass } from "../../entity/DocumentClass";

export interface IGetDocumentClassByIdUC {
    execute(id: number): DocumentClass | null;
}