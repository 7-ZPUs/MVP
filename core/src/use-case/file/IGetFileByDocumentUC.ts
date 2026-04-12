import type { File } from '../../entity/File';

export interface IGetFileByDocumentUC {
    execute(documentId: number): File[];
}
