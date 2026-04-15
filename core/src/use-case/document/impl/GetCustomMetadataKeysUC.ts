import { inject, injectable } from "tsyringe";
import {
  DOCUMENT_GET_DISTINCT_CUSTOM_METADATA_KEYS_PORT_TOKEN,
  IGetDistinctDocumentCustomMetadataKeysPort,
} from "../../../repo/IDocumentRepository";
import { IGetCustomMetadataKeysUC } from "../IGetCustomMetadataKeysUC";

@injectable()
export class GetCustomMetadataKeysUC implements IGetCustomMetadataKeysUC {
  constructor(
    @inject(DOCUMENT_GET_DISTINCT_CUSTOM_METADATA_KEYS_PORT_TOKEN)
    private readonly documentRepo: IGetDistinctDocumentCustomMetadataKeysPort,
  ) {}

  execute(dipId: number | null): string[] {
    return this.documentRepo.getDistinctCustomMetadataKeys(dipId);
  }
}
