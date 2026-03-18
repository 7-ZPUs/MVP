import { MetadataDTO } from "../dto/MetadataDTO";

export enum MetadataType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Composite = "composite",
}

export class Metadata {
  constructor(
    public readonly name: string,
    public readonly value: string,
    public readonly type: MetadataType = MetadataType.String,
  ) {}

  /**
   * Serializza in un plain object trasferibile via IPC.
   * Da chiamare SOLO nell'IPC adapter.
   */
  public toDTO(): MetadataDTO {
    return {
      name: this.name,
      value: this.value,
      type: this.type,
    };
  }
}
