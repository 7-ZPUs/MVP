import { inject, injectable } from 'tsyringe';
import type { ClasseDocumentale } from '../../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../../../repo/IClasseDocumentaleRepository';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from '../../../repo/IClasseDocumentaleRepository';
import type { ICreateClasseDocumentaleUC } from '../ICreateClasseDocumentaleUC';

@injectable()
export class CreateClasseDocumentaleUC implements ICreateClasseDocumentaleUC {
    constructor(
        @inject(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN)
        private readonly repo: IClasseDocumentaleRepository
    ) { }

    execute(nome: string): ClasseDocumentale {
        return this.repo.create(nome);
    }
}
