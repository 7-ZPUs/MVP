import { MetadataDTO } from "./MetadataDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface CreateDocumentDTO {
  processId: number;
  uuid: string;
  metadata: MetadataDTO[];
}

export interface DocumentDTO {
  id: number;
  processId: number;
  uuid: string;
  integrityStatus: IntegrityStatusEnum;
  metadata: MetadataDTO;
}
