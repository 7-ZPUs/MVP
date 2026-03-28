import { DocumentClass } from "../../entity/DocumentClass";

export interface CreateDocumentClassInput {
    dipId: number;
    uuid: string;
    name: string;
    timestamp: string;
}

export interface ICreateDocumentClassUC {
    execute(input: CreateDocumentClassInput): DocumentClass;
}