import { inject, injectable } from 'tsyringe';
import type { File } from '../../../entity/File';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { IGetFileByIdUC } from '../IGetFileByIdUC';

@injectable()
export class GetFileByIdUC implements IGetFileByIdUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly repo: IFileRepository
    ) { }

    execute(id: number): File | null {
        return this.repo.getById(id);
    }
}
