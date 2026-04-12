import { MetadataType } from '../value-objects/Metadata';

export interface MetadataDTO {
  name: string;
  value: string | number | boolean | MetadataDTO[];
  type: MetadataType;
}
