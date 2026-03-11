import { inject, injectable } from 'tsyringe';
import type { Documento } from '../../../entity/Document';
import type { IDocumentoRepository } from '../../../repo/IDocumentoRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentoRepository';
import type { IGetDocumentoByIdUC } from '../IGetDocumentoByIdUC';

@injectable()
export class GetDocumentoByIdUC implements IGetDocumentoByIdUC {
    constructor(
        @inject(DOCUMENTO_REPOSITORY_TOKEN)
        private readonly repo: IDocumentoRepository
    ) { }

    execute(id: number): Documento | null {
        return this.repo.getById(id);
    }
}
