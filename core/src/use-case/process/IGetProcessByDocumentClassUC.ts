import { Process } from "../../entity/Process";

export interface IGetProcessByDocumentClassUC {
    execute(documentClassId: number): Process[];
}