import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface IGetAllClasseDocumentaleUC {
    execute(): ClasseDocumentale[];
}
