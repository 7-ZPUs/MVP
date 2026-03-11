import type { Documento } from '../../entity/Document';

export interface IGetDocumentiByProcessUC {
    execute(processId: number): Documento[];
}
