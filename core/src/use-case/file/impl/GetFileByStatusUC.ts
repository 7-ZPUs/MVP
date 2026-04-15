import { inject, injectable } from "tsyringe";
import type { File } from "../../../entity/File";
import type { IGetFileByStatusPort } from "../../../repo/IFileRepository";
import { FILE_GET_BY_STATUS_PORT_TOKEN } from "../../../repo/IFileRepository";
import type { IGetFileByStatusUC } from "../IGetFileByStatusUC";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";

@injectable()
export class GetFileByStatusUC implements IGetFileByStatusUC {
  constructor(
    @inject(FILE_GET_BY_STATUS_PORT_TOKEN)
    private readonly repo: IGetFileByStatusPort,
  ) {}

  execute(status: IntegrityStatusEnum): File[] {
    return this.repo.getByStatus(status);
  }
}
