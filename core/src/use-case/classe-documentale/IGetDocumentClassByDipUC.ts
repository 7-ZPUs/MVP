import { DocumentClass } from "../../entity/DocumentClass";

export interface IGetDocumentClassByDipIdUC {
    execute(dipId: number): DocumentClass[];
}