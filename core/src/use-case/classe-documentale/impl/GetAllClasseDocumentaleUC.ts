import { inject, injectable } from 'tsyringe';
import type { ClasseDocumentale } from '../../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../../../repo/IClasseDocumentaleRepository';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from '../../../repo/IClasseDocumentaleRepository';
import type { IGetAllClasseDocumentaleUC } from '../IGetAllClasseDocumentaleUC';

@injectable()
export class GetAllClasseDocumentaleUC implements IGetAllClasseDocumentaleUC {
    constructor(
        @inject(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN)
        private readonly repo: IClasseDocumentaleRepository
    ) { }

    execute(): ClasseDocumentale[] {
        return this.repo.getAll();
    }
}
