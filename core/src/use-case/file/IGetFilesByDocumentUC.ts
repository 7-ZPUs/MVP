import type { File } from '../../entity/File';

export interface IGetFilesByDocumentUC {
    execute(documentId: number): File[];
}
