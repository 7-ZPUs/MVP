import { inject, injectable } from "tsyringe";
import type { File } from "../../../entity/File";
import type { IFileRepository } from "../../../repo/IFileRepository";
import { FILE_REPOSITORY_TOKEN } from "../../../repo/IFileRepository";
import { ICreateFileUC } from "../ICreateFileUC";

@injectable()
export class CreateFileUC implements ICreateFileUC {
  constructor(
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly repo: IFileRepository,
  ) {}

  execute(file: File): File {
    return this.repo.save(file);
  }
}
