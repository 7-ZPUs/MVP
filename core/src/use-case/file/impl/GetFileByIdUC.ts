import { inject, injectable } from "tsyringe";
import type { File } from "../../../entity/File";
import type { IGetFileByIdPort } from "../../../repo/IFileRepository";
import { FILE_GET_BY_ID_PORT_TOKEN } from "../../../repo/IFileRepository";
import type { IGetFileByIdUC } from "../IGetFileByIdUC";

@injectable()
export class GetFileByIdUC implements IGetFileByIdUC {
  constructor(
    @inject(FILE_GET_BY_ID_PORT_TOKEN)
    private readonly repo: IGetFileByIdPort,
  ) {}

  execute(id: number): File | null {
    return this.repo.getById(id);
  }
}
