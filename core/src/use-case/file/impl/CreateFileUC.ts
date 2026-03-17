import { inject, injectable } from 'tsyringe';
import { CreateFileDTO } from '../../../dto/FileDTO';
import type { File } from '../../../entity/File';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import { ICreateFileUC } from '../ICreateFileUC';

@injectable()
export class CreateFileUC implements ICreateFileUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly repo: IFileRepository
    ) { }

    execute(dto: CreateFileDTO): File {
        return this.repo.save(dto);
    }
}
