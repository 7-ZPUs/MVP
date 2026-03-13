import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface CreateFileDTO {
    documentId: number;
    filename: string;
    path: string;
    isMain: boolean;
}

export interface FileDTO {
    id: number;
    /** Chiave esterna verso Documento. */
    documentId: number;
    filename: string;
    path: string;
    integrityStatus: IntegrityStatusEnum;
    isMain: boolean;
}