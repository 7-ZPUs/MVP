import type { Document } from '../../entity/Document';

export interface CreateDocumentInput {
    processId: number;
    uuid: string;
    metadata: {
        name: string;
        value: string;
        type: string;
    }[];
}

export interface ICreateDocumentUC {
    execute(input: CreateDocumentInput): Document;
}
