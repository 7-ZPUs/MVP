/**
 * MetadataHelper — shared utilities for metadata persistence (SQLite)
 *
 * Usato da DocumentoRepository e ProcessRepository per evitare duplicazioni.
 */
import Database from "better-sqlite3";
import { Metadata, MetadataType } from "../../value-objects/Metadata";

export interface MetadataRow {
  id: number;
  parent_id: number | null;
  name: string;
  value: string;
  type: string;
}

/**
 * Carica i metadati associati a un record dato il suo id.
 *
 * @param db         istanza del database
 * @param table      nome della tabella dei metadati (es. 'documento_metadata')
 * @param fkColumn   nome della colonna foreign-key (es. 'document_id')
 * @param ownerId    id del record padre
 */
export function loadMetadata(
  db: Database.Database,
  table: string,
  fkColumn: string,
  ownerId: number,
): Metadata | null {
  const rows = db
    .prepare<
      [number],
      MetadataRow
    >(`SELECT * FROM ${table} WHERE ${fkColumn} = ? ORDER BY id`)
    .all(ownerId);

  const rowById = new Map<number, MetadataRow>();
  const childrenByParentId = new Map<number, number[]>();
  const rootIds: number[] = [];

  for (const row of rows) {
    rowById.set(row.id, row);
    if (row.parent_id == null) {
      rootIds.push(row.id);
      continue;
    }
    const children = childrenByParentId.get(row.parent_id) ?? [];
    children.push(row.id);
    childrenByParentId.set(row.parent_id, children);
  }

  const buildNode = (id: number): Metadata => {
    const row = rowById.get(id);
    if (!row) {
      throw new Error(`Invalid metadata tree: missing row for id ${id}`);
    }

    const type = row.type as MetadataType;
    if (type !== MetadataType.COMPOSITE) {
      return new Metadata(row.name, row.value, type);
    }

    const childrenIds = childrenByParentId.get(id) ?? [];
    const children = childrenIds.map((childId) => buildNode(childId));
    return new Metadata(row.name, children, MetadataType.COMPOSITE);
  };

  const rootNodes = rootIds.map((id) => buildNode(id));

  if (rootNodes.length === 0) {
    return null;
  }

  if (rootNodes.length === 1) {
    return rootNodes[0];
  }

  // Multiple top-level nodes are represented as a synthetic composite root.
  return new Metadata("root", rootNodes, MetadataType.COMPOSITE);
}

/**
 * Salva i metadati associandoli a un record dato il suo id.
 *
 * @param db         istanza del database
 * @param table      nome della tabella dei metadati
 * @param fkColumn   nome della colonna foreign-key
 * @param ownerId    id del record padre
 * @param metadata   lista di Metadata da persistere
 */
export function saveMetadata(
  db: Database.Database,
  table: string,
  fkColumn: string,
  ownerId: number,
  metadata: Metadata | Metadata[],
): void {
  const stmt = db.prepare(
    `INSERT INTO ${table} (${fkColumn}, parent_id, name, value, type) VALUES (?, ?, ?, ?, ?)`,
  );

  function insertRecursive(meta: Metadata, parentId: number | null) {
    const type = meta.getType();
    const dbValue =
      type === MetadataType.COMPOSITE ? "" : meta.getStringValue();

    const info = stmt.run(ownerId, parentId, meta.getName(), dbValue, type);
    const lastId = info.lastInsertRowid as number;

    if (type === MetadataType.COMPOSITE) {
      for (const child of meta.getChildren()) {
        insertRecursive(child, lastId);
      }
    }
  }

  const metadataList = Array.isArray(metadata) ? metadata : [metadata];

  for (const m of metadataList) {
    insertRecursive(m, null);
  }
}
