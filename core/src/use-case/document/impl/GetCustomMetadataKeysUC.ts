import { inject, injectable } from "tsyringe";
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  IDocumentRepository,
} from "../../../repo/IDocumentRepository";
import { IGetCustomMetadataKeysUC } from "../IGetCustomMetadataKeysUC";

@injectable()
export class GetCustomMetadataKeysUC implements IGetCustomMetadataKeysUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  execute(dipId: number | null): string[] {
    return this.documentRepo.getDistinctCustomMetadataKeys(dipId);
  }
}
