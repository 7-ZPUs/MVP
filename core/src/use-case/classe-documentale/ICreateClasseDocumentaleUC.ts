import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface ICreateClasseDocumentaleUC {
    execute(nome: string, uuid: string): ClasseDocumentale;
}
