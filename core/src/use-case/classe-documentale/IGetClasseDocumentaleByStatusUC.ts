import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';
import { StatoVerificaEnum } from '../../value-objects/StatoVerificaEnum';

export interface IGetClasseDocumentaleByStatusUC {
    execute(stato: StatoVerificaEnum): ClasseDocumentale[];
}
