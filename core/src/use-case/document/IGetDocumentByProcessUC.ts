import type { Document } from '../../entity/Document';

export interface IGetDocumentByProcessUC {
    execute(processId: number): Document[];
}
