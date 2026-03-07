import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface IGetClasseDocumentaleByIdUC {
    execute(id: number): ClasseDocumentale | undefined;
}
