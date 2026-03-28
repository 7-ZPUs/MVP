/**
 * MetadataHelper — shared utilities for metadata persistence (SQLite)
 *
 * Usato da DocumentoRepository e ProcessRepository per evitare duplicazioni.
 */
import Database from 'better-sqlite3';
import { Metadata } from '../../value-objects/Metadata';

export interface MetadataRow {
    id: number;
    document_id: number;
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
    ownerId: number
): Metadata[] {
    const rows = db
        .prepare<[number], MetadataRow>(
            `SELECT * FROM ${table} WHERE ${fkColumn} = ? ORDER BY id`
        )
        .all(ownerId);
    return rows.map((r) => new Metadata(r.name, r.value, r.type as Metadata['type']));
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
    metadata: Metadata[]
): void {
    const stmt = db.prepare(
        `INSERT INTO ${table} (${fkColumn}, name, value, type) VALUES (?, ?, ?, ?)`
    );
    for (const m of metadata) {
        stmt.run(ownerId, m.name, m.value, m.type);
    }
}
