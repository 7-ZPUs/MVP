import { inject, injectable } from 'tsyringe';
import type { ClasseDocumentale } from '../../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../../../repo/IClasseDocumentaleRepository';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from '../../../repo/IClasseDocumentaleRepository';
import type { IGetClasseDocumentaleByIdUC } from '../IGetClasseDocumentaleByIdUC';

@injectable()
export class GetClasseDocumentaleByIdUC implements IGetClasseDocumentaleByIdUC {
    constructor(
        @inject(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN)
        private readonly repo: IClasseDocumentaleRepository
    ) { }

    execute(id: number): ClasseDocumentale | undefined {
        return this.repo.getById(id);
    }
}
