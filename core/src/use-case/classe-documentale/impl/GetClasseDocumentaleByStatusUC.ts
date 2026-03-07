import { inject, injectable } from 'tsyringe';
import type { ClasseDocumentale } from '../../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../../../repo/IClasseDocumentaleRepository';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from '../../../repo/IClasseDocumentaleRepository';
import { IGetClasseDocumentaleByStatusUC } from '../IGetClasseDocumentaleByStatusUC';
import { StatoVerificaEnum } from '../../../value-objects/StatoVerificaEnum';

@injectable()
export class GetClasseDocumentaleByStatusUC implements IGetClasseDocumentaleByStatusUC {
    constructor(
        @inject(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN)
        private readonly repo: IClasseDocumentaleRepository
    ) { }

    execute(stato: StatoVerificaEnum): ClasseDocumentale[] {
        return this.repo.getByStatus(stato);
    }
}
