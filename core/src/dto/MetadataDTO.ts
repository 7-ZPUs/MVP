import { Metadata, MetadataType } from "../value-objects/Metadata";

export interface MetadataDTO {
  name: string;
  value: string | Metadata[];
  type: MetadataType;
}
