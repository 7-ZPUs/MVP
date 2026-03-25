import { CreateDocumentClassDTO } from "../../dto/DocumentClassDTO";
import { DocumentClass } from "../../entity/DocumentClass";

export interface ICreateDocumentClassUC {
    execute(dto: CreateDocumentClassDTO): DocumentClass;
}