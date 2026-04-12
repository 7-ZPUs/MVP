/**
 * MetadataHelper — shared utilities for metadata persistence (SQLite)
 *
 * Usato da DocumentoRepository e ProcessRepository per evitare duplicazioni.
 */
import Database from "better-sqlite3";
import { MetadataPersistenceRow } from "./mappers/MetadataMapper";
import { Metadata, MetadataType } from "../value-objects/Metadata";

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
): MetadataPersistenceRow[] {
  const rows = db
    .prepare<
      [number],
      MetadataPersistenceRow
    >(`SELECT * FROM ${table} WHERE ${fkColumn} = ? ORDER BY id`)
    .all(ownerId);

  return rows;
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
