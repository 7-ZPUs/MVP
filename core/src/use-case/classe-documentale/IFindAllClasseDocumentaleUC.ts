import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface IFindAllClasseDocumentaleUC {
    execute(): ClasseDocumentale[];
}
