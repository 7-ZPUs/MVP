import { MetadataDTO } from "../../dto/MetadataDTO";
import { Metadata, MetadataType } from "../../value-objects/Metadata";

export interface MetadataPersistenceRow {
  id: number;
  parent_id: number | null;
  name: string;
  value: string;
  type: MetadataType | string;
}

export class MetadataMapper {
  private static normalizeType(type: MetadataType | string): MetadataType {
    const normalizedType = String(type).toUpperCase();

    if (normalizedType === MetadataType.STRING) {
      return MetadataType.STRING;
    }

    if (normalizedType === MetadataType.NUMBER) {
      return MetadataType.NUMBER;
    }

    if (normalizedType === MetadataType.BOOLEAN) {
      return MetadataType.BOOLEAN;
    }

    if (normalizedType === MetadataType.COMPOSITE) {
      return MetadataType.COMPOSITE;
    }

    throw new Error(`Invalid metadata type: ${type}`);
  }

  static toDTO(metadata: Metadata): MetadataDTO {
    return {
      name: metadata.getName(),
      value:
        metadata.getType() !== MetadataType.COMPOSITE
          ? metadata.getStringValue()
          : metadata.getChildren().map((child) => this.toDTO(child)),
      type: metadata.getType(),
    };
  }

  static fromFlatRows(rows: MetadataPersistenceRow[]): Metadata {
    if (rows.length === 0) {
      throw new Error("Cannot build metadata tree from empty rows");
    }

    const rowById = new Map<number, MetadataPersistenceRow>();
    const childrenByParentId = new Map<number, number[]>();
    const rootIds: number[] = [];

    for (const row of rows) {
      if (rowById.has(row.id)) {
        throw new Error(`Invalid metadata tree: duplicate row id ${row.id}`);
      }
      rowById.set(row.id, row);

      if (row.parent_id == null) {
        rootIds.push(row.id);
        continue;
      }

      const children = childrenByParentId.get(row.parent_id) ?? [];
      children.push(row.id);
      childrenByParentId.set(row.parent_id, children);
    }

    for (const row of rows) {
      if (row.parent_id != null && !rowById.has(row.parent_id)) {
        throw new Error(
          `Invalid metadata tree: missing parent row for id ${row.id} (parent_id=${row.parent_id})`,
        );
      }
    }

    const buildNode = (id: number, path: Set<number>): Metadata => {
      if (path.has(id)) {
        throw new Error(
          `Invalid metadata tree: cycle detected at row id ${id}`,
        );
      }

      const row = rowById.get(id);
      if (!row) {
        throw new Error(`Invalid metadata tree: missing row for id ${id}`);
      }

      path.add(id);

      const type = this.normalizeType(row.type);
      if (type !== MetadataType.COMPOSITE) {
        path.delete(id);
        return new Metadata(row.name, row.value, type);
      }

      const childrenIds = childrenByParentId.get(id) ?? [];
      const children = childrenIds.map((childId) => buildNode(childId, path));

      path.delete(id);
      return new Metadata(row.name, children, MetadataType.COMPOSITE);
    };

    if (rootIds.length === 0) {
      throw new Error("Invalid metadata tree: no root nodes found");
    }

    const rootNodes = rootIds.map((id) => buildNode(id, new Set<number>()));

    if (rootNodes.length === 1) {
      return rootNodes[0];
    }

    // Multiple top-level nodes are represented as a synthetic composite root.
    return new Metadata("root", rootNodes, MetadataType.COMPOSITE);
  }

  static flatten(metadata: Metadata): Metadata[] {
    if (metadata.getType() !== MetadataType.COMPOSITE) {
      return [metadata];
    } else {
      return metadata.getChildren().flatMap((child) => this.flatten(child));
    }
  }
}
