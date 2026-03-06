import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface IFindByIdClasseDocumentaleUC {
    execute(id: number): ClasseDocumentale | undefined;
}
