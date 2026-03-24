import type { Process } from '../../entity/Process';
import { MetadataType } from '../../value-objects/Metadata';

export interface CreateProcessInput {
    documentClassId: number;
    uuid: string;
    metadata: {
        name: string;
        value: string;
        type: MetadataType;
    }[];
}

export interface ICreateProcessUC {
    execute(input: CreateProcessInput): Process;
}
