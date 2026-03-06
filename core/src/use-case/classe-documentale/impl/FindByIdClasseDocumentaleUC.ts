import { inject, injectable } from 'tsyringe';
import type { ClasseDocumentale } from '../../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../../../repo/IClasseDocumentaleRepository';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from '../../../repo/IClasseDocumentaleRepository';
import type { IFindByIdClasseDocumentaleUC } from '../IFindByIdClasseDocumentaleUC';

@injectable()
export class FindByIdClasseDocumentaleUC implements IFindByIdClasseDocumentaleUC {
    constructor(
        @inject(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN)
        private readonly repo: IClasseDocumentaleRepository
    ) { }

    execute(id: number): ClasseDocumentale | undefined {
        return this.repo.findById(id);
    }
}
