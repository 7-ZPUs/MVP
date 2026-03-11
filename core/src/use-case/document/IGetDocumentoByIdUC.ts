import type { Documento } from '../../entity/Document';

export interface IGetDocumentoByIdUC {
    execute(id: number): Documento | null;
}
