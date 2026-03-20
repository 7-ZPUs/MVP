import { inject, injectable } from 'tsyringe';
import { File } from '../../../entity/File';
import type { IFileRepository } from '../../../repo/IFileRepository';
import { FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import type { CreateFileInput, ICreateFileUC } from '../ICreateFileUC';

@injectable()
export class CreateFileUC implements ICreateFileUC {
  constructor(
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly repo: IFileRepository,
  ) {}

    execute(input: CreateFileInput): File {
        const file = new File(
            input.filename,
            input.path,
            input.hash,
            input.isMain,
            input.documentId,
        );

        return this.repo.save(file);
    }
}
