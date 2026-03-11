import { inject, injectable } from 'tsyringe';
import type { File } from '../../../entity/File';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { IGetFilesByStatusUC } from '../IGetFilesByStatusUC';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';

@injectable()
export class GetFilesByStatusUC implements IGetFilesByStatusUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly repo: IFileRepository
    ) { }

    execute(status: IntegrityStatusEnum): File[] {
        return this.repo.getByStatus(status);
    }
}
