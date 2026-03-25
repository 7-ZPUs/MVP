/**
 * MetadataHelper — shared utilities for metadata persistence (SQLite)
 *
 * Usato da DocumentoRepository e ProcessRepository per evitare duplicazioni.
 */
import Database from "better-sqlite3";
import { Metadata } from "../../value-objects/Metadata";

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
): Metadata[] {
  const rows = db
    .prepare<
      [number],
      MetadataRow
    >(`SELECT * FROM ${table} WHERE ${fkColumn} = ? ORDER BY id`)
    .all(ownerId);

  // Mappa per associare i node per il loro id
  const metadataMap = new Map<number, Metadata>();
  // Nodes that have parent_id = null will go here
  const rootNodes: Metadata[] = [];

  // Prima passata: crea i Metadata object e associali al loro id dalla row
  for (const r of rows) {
    // Se il tipo è COMPOSITE, il value logico atteso in memoria è un array, non una stringa
    const parsedValue = r.type === "COMPOSITE" ? [] : r.value;
    const metadataObj = new Metadata(
      r.name,
      parsedValue,
      r.type as Metadata["type"],
    );
    metadataMap.set(r.id, metadataObj);
  }

  // Seconda passata: ricostruisci l'albero inserendo i figli nei rispettivi parent
  for (const r of rows) {
    const metadataObj = metadataMap.get(r.id)!;
    if (r.parent_id == null) {
      // Nodo radice
      rootNodes.push(metadataObj);
    } else {
      const parentMetadata = metadataMap.get(r.parent_id);
      if (parentMetadata && Array.isArray(parentMetadata.value)) {
        parentMetadata.value.push(metadataObj);
      }
    }
  }

  return rootNodes;
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
  metadata: Metadata[],
): void {
  const stmt = db.prepare(
    `INSERT INTO ${table} (${fkColumn}, parent_id, name, value, type) VALUES (?, ?, ?, ?, ?)`,
  );

  function insertRecursive(meta: Metadata, parentId: number | null) {
    // Se è COMPOSITE, salviamo una stringa vuota o descrittiva su DB.
    const dbValue = meta.type === "COMPOSITE" ? "" : (meta.value as string);

    const info = stmt.run(ownerId, parentId, meta.name, dbValue, meta.type);
    const lastId = info.lastInsertRowid as number;

    if (meta.type === "COMPOSITE" && Array.isArray(meta.value)) {
      for (const child of meta.value) {
        insertRecursive(child, lastId);
      }
    }
  }

  for (const m of metadata) {
    insertRecursive(m, null);
  }
}
