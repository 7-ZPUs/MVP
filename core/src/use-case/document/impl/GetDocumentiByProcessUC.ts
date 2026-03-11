import { inject, injectable } from 'tsyringe';
import type { Documento } from '../../../entity/Document';
import type { IDocumentoRepository } from '../../../repo/IDocumentoRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentoRepository';
import type { IGetDocumentiByProcessUC } from '../IGetDocumentiByProcessUC';

@injectable()
export class GetDocumentiByProcessUC implements IGetDocumentiByProcessUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentoRepository
    ) { }

    execute(processId: number): Documento[] {
        return this.repo.getByProcessId(processId);
    }
}
