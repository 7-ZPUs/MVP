import { inject, injectable } from 'tsyringe';
import type { Documento } from '../../../entity/Document';
import type { IDocumentoRepository } from '../../../repo/IDocumentoRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentoRepository';
import type { IGetDocumentiByStatusUC } from '../IGetDocumentiByStatusUC';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';

@injectable()
export class GetDocumentiByStatusUC implements IGetDocumentiByStatusUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentoRepository
    ) { }

    execute(status: IntegrityStatusEnum): Documento[] {
        return this.repo.getByStatus(status);
    }
}
