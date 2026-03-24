import type { Document } from '../../entity/Document';
import { MetadataType } from '../../value-objects/Metadata';

export interface CreateDocumentInput {
    processId: number;
    uuid: string;
    metadata: {
        name: string;
        value: string;
        type: MetadataType;
    }[];
}

export interface ICreateDocumentUC {
    execute(input: CreateDocumentInput): Document;
}
