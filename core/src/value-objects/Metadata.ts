export enum MetadataType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  COMPOSITE = "COMPOSITE",
}

export class Metadata {
  constructor(
    private readonly name: string,
    private readonly value: string | Metadata[],
    private readonly type: MetadataType = MetadataType.STRING,
  ) {}

  /**
   * Serializza in un plain object trasferibile via IPC.
   * Da chiamare SOLO nell'IPC adapter.
   */

  public findNodeByName(name: string): Metadata | null {
    if (this.name.toLowerCase() === name.toLowerCase()) {
      return this;
    }

    if (this.type !== MetadataType.COMPOSITE) {
      return null;
    }

    for (const child of this.getChildren()) {
      const found = child.findNodeByName(name);
      if (found) {
        return found;
      }
    }

    return null;
  }

  public getStringValue(): string {
    if (this.type === MetadataType.COMPOSITE) {
      throw new Error(`Metadata ${this.name} is a COMPOSITE, not a STRING.`);
    }
    return this.value as string;
  }

  // Returns the children, or an empty array if it's a leaf
  public getChildren(): Metadata[] {
    if (this.type !== MetadataType.COMPOSITE) {
      return [];
    }
    return this.value as Metadata[];
  }

  public isComposite(): boolean {
    return this.type === MetadataType.COMPOSITE;
  }

  public getType(): MetadataType {
    return this.type;
  }

  public getName(): string {
    return this.name;
  }
}
