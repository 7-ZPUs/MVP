import { inject, injectable } from 'tsyringe';
import type { File } from '../../../entity/File';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { IGetFileByStatusUC } from '../IGetFileByStatusUC';
import { IntegrityStatusEnum } from '../../../value-objects/IntegrityStatusEnum';

@injectable()
export class GetFileByStatusUC implements IGetFileByStatusUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly repo: IFileRepository
    ) { }

    execute(status: IntegrityStatusEnum): File[] {
        return this.repo.getByStatus(status);
    }
}
