import { Metadata } from "../../../value-objects/Metadata";

export class DocumentMetadataHashMapper {
  private getCompositeChildren(metadata: Metadata | undefined): Metadata[] {
    if (!metadata || typeof metadata.value === "string") {
      return [];
    }
    return metadata.value;
  }

  private extractHashFromIdDoc(idDoc: Metadata): {
    uuid?: string;
    hash?: string;
  } {
    const children = this.getCompositeChildren(idDoc);
    const uuid = children.find((item) => item.name === "Identificativo")?.value;
    const improntaNode = children.find(
      (item) => item.name === "ImprontaCrittograficaDelDocumento",
    );
    const impronta = this.getCompositeChildren(improntaNode).find(
      (item) => item.name === "Impronta",
    )?.value;

    return {
      uuid: typeof uuid === "string" ? uuid : undefined,
      hash: typeof impronta === "string" ? impronta : undefined,
    };
  }

  public map(metadata: Metadata[], mainFileUuid?: string): Map<string, string> {
    const hashByFileUuid = new Map<string, string>();

    const mainIdDoc = metadata.find((item) => item.name === "IdDoc");
    if (mainIdDoc) {
      const { uuid, hash } = this.extractHashFromIdDoc(mainIdDoc);
      if (hash) {
        if (uuid) {
          hashByFileUuid.set(uuid, hash);
        } else if (mainFileUuid) {
          hashByFileUuid.set(mainFileUuid, hash);
        }
      }
    }

    const allegati = metadata.find((item) => item.name === "Allegati");
    const indiceAllegati = this.getCompositeChildren(allegati).filter(
      (item) => item.name === "IndiceAllegati",
    );

    for (const indice of indiceAllegati) {
      const idDoc = this.getCompositeChildren(indice).find(
        (item) => item.name === "IdDoc",
      );
      if (!idDoc) {
        continue;
      }
      const { uuid, hash } = this.extractHashFromIdDoc(idDoc);
      if (uuid && hash) {
        hashByFileUuid.set(uuid, hash);
      }
    }

    return hashByFileUuid;
  }
}
