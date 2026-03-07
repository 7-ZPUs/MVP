import { inject, injectable } from 'tsyringe';
import type { ClasseDocumentale } from '../../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../../../repo/IClasseDocumentaleRepository';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from '../../../repo/IClasseDocumentaleRepository';
import type { IHashingService } from '../../../services/IHashingService';
import { HASHING_SERVICE_TOKEN } from '../../../services/IHashingService';
import { StatoVerificaEnum } from '../../../value-objects/StatoVerificaEnum';
import type { ICheckClasseDocumentaleIntegrityUC } from '../ICheckClasseDocumentaleIntegrityUC';

@injectable()
export class CheckClasseDocumentaleIntegrityUC implements ICheckClasseDocumentaleIntegrityUC {
    constructor(
        @inject(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN)
        private readonly repo: IClasseDocumentaleRepository,

        @inject(HASHING_SERVICE_TOKEN)
        private readonly hashingService: IHashingService,
    ) { }

    async execute(id: number): Promise<ClasseDocumentale | undefined> {
        const classeDocumentale = this.repo.getById(id);
        if (!classeDocumentale) return undefined;

        const expectedHash = classeDocumentale.hash;
        if (!expectedHash) {
            return { ...classeDocumentale, stato: StatoVerificaEnum.NON_VERIFICATO };
        }

        const serialized = JSON.stringify({
            id: classeDocumentale.id,
            uuid: classeDocumentale.uuid,
            nome: classeDocumentale.nome,
            metadati: classeDocumentale.metadati ?? [],
        });
        const buffer = new TextEncoder().encode(serialized).buffer;

        const calcolato = await this.hashingService.calcolaHash(buffer);
        const statoVerifica = calcolato === expectedHash
            ? StatoVerificaEnum.VALIDO
            : StatoVerificaEnum.NON_VALIDO;

        return { ...classeDocumentale, hash: calcolato, stato: statoVerifica };
    }
}
