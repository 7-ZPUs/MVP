import { inject, injectable } from 'tsyringe';
import type { File } from '../../../entity/File';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { IGetFilesByDocumentUC } from '../IGetFilesByDocumentUC';

@injectable()
export class GetFilesByDocumentUC implements IGetFilesByDocumentUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly repo: IFileRepository
    ) { }

    execute(documentId: number): File[] {
        return this.repo.getByDocumentId(documentId);
    }
}
