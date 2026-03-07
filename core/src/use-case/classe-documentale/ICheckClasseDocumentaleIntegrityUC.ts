import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';

export interface ICheckClasseDocumentaleIntegrityUC {
    execute(id: number): Promise<ClasseDocumentale | undefined>;
}
