import { MetadataDTO } from "../dto/MetadataDTO";

export enum MetadataType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  COMPOSITE = "COMPOSITE",
}

export class Metadata {
  constructor(
    public readonly name: string,
    public readonly value: string | Metadata[],
    public readonly type: MetadataType = MetadataType.STRING,
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
