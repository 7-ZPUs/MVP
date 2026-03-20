import type { Process } from '../../entity/Process';

export interface CreateProcessInput {
    documentClassId: number;
    uuid: string;
    metadata: {
        name: string;
        value: string;
        type: string;
    }[];
}

export interface ICreateProcessUC {
    execute(input: CreateProcessInput): Process;
}
