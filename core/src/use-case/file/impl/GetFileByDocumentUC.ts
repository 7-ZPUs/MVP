import { inject, injectable } from "tsyringe";
import type { File } from "../../../entity/File";
import type { IGetFileByDocumentIdPort } from "../../../repo/IFileRepository";
import { FILE_GET_BY_DOCUMENT_ID_PORT_TOKEN } from "../../../repo/IFileRepository";
import type { IGetFileByDocumentUC } from "../IGetFileByDocumentUC";

@injectable()
export class GetFileByDocumentUC implements IGetFileByDocumentUC {
  constructor(
    @inject(FILE_GET_BY_DOCUMENT_ID_PORT_TOKEN)
    private readonly repo: IGetFileByDocumentIdPort,
  ) {}

  execute(documentId: number): File[] {
    return this.repo.getByDocumentId(documentId);
  }
}
