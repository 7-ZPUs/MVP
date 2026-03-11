import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface FileDTO {
    /** null se l'entità non è ancora stata persistita. */
    id: number | null;
    /** Chiave esterna verso Documento. */
    documentId: number;
    filename: string;
    path: string;
    integrityStatus: IntegrityStatusEnum;
    isMain: boolean;
}