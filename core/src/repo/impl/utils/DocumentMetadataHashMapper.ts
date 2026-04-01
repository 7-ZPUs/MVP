import { Metadata } from "../../../value-objects/Metadata";

export class DocumentMetadataHashMapper {
  private readonly documentRoots = new Set([
    "DocumentoInformatico",
    "DocumentoAmministrativoInformatico",
    "AggregazioneDocumentaliInformatiche",
  ]);

  private getCompositeChildren(metadata: Metadata | undefined): Metadata[] {
    if (!metadata) {
      return [];
    }
    return metadata.getChildren();
  }

  private unwrapDocumentRoot(metadata: Metadata[]): Metadata[] {
    if (metadata.length !== 1) {
      return metadata;
    }

    const onlyNode = metadata[0];
    if (!this.documentRoots.has(onlyNode.getName())) {
      return metadata;
    }

    return onlyNode.getChildren();
  }

  private extractHashFromIdDoc(idDoc: Metadata): {
    uuid?: string;
    hash?: string;
  } {
    const children = this.getCompositeChildren(idDoc);
    const uuid = children
      .find((item) => item.getName() === "Identificativo")
      ?.getStringValue();
    const improntaNode = children.find(
      (item) => item.getName() === "ImprontaCrittograficaDelDocumento",
    );
    const impronta = this.getCompositeChildren(improntaNode)
      .find((item) => item.getName() === "Impronta")
      ?.getStringValue();

    return {
      uuid: typeof uuid === "string" ? uuid : undefined,
      hash: typeof impronta === "string" ? impronta : undefined,
    };
  }

  public map(metadata: Metadata[], mainFileUuid?: string): Map<string, string> {
    const hashByFileUuid = new Map<string, string>();
    const normalizedMetadata = this.unwrapDocumentRoot(metadata);

    const mainIdDoc = normalizedMetadata.find(
      (item) => item.getName() === "IdDoc",
    );
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

    const allegati = normalizedMetadata.find(
      (item) => item.getName() === "Allegati",
    );
    const indiceAllegati = this.getCompositeChildren(allegati).filter(
      (item) => item.getName() === "IndiceAllegati",
    );

    for (const indice of indiceAllegati) {
      const idDoc = this.getCompositeChildren(indice).find(
        (item) => item.getName() === "IdDoc",
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
