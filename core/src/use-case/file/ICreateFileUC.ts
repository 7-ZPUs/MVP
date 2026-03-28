import type { File } from '../../entity/File';

export interface CreateFileInput {
    documentId: number;
    filename: string;
    path: string;
    isMain: boolean;
    hash: string;
}

export interface ICreateFileUC {
    execute(input: CreateFileInput): File;
}
