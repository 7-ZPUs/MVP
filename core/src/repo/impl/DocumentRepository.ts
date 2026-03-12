/**
 * DocumentRepository — Infrastructure Repository (SQLite)
 *
 * Implementa IDocumentRepository usando better-sqlite3.
 * Zero business logic: solo persistenza.
 *
 * Schema gestito:
 *   document            (id, uuid, integrity_status, process_id)
 *   document_metadata   (id, document_id, name, value, type)
 */
import { inject, injectable } from 'tsyringe';
import Database from 'better-sqlite3';

import { Document, DocumentRow } from '../../entity/Document';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';
import type { IDocumentRepository } from '../IDocumentRepository';
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from './DatabaseProvider';
import { loadMetadata, saveMetadata } from './MetadataHelper';

const METADATA_TABLE = 'document_metadata';
const METADATA_FK = 'document_id';

@injectable()
export class DocumentRepository implements IDocumentRepository {
    private readonly db: Database.Database;

    constructor(
        @inject(DATABASE_PROVIDER_TOKEN)
        private readonly dbProvider: DatabaseProvider
    ) {
        this.db = dbProvider.db;
        this.createSchema();
    }

    private createSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS document (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN',
                process_id       INTEGER
            );

            CREATE TABLE IF NOT EXISTS document_metadata (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
                name        TEXT    NOT NULL,
                value       TEXT    NOT NULL,
                type        TEXT    NOT NULL DEFAULT 'string'
            );
        `);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private rowToEntity(row: DocumentRow): Document {
        const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
        return Document.fromDB(row, metadata);
    }

    // -------------------------------------------------------------------------
    // IDocumentRepository implementation
    // -------------------------------------------------------------------------

    getById(id: number): Document | null {
        const row = this.db
            // possiamo anche usare SELECT * a questo punto 
            .prepare<[number], DocumentRow>(
                `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId 
                 FROM document WHERE id = ?`
            )
            .get(id);
        return row ? this.rowToEntity(row) : null;
    }

    getByProcessId(processId: number): Document[] {
        const rows = this.db
            .prepare<[number], DocumentRow>(
                `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE process_id = ? ORDER BY id`
            )
            .all(processId);
        return rows.map((r) => this.rowToEntity(r));
    }

    getByStatus(status: IntegrityStatusEnum): Document[] {
        const rows = this.db
            .prepare<[string], DocumentRow>(
                `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE integrity_status = ? ORDER BY id`
            )
            .all(status);
        return rows.map((r) => this.rowToEntity(r));
    }

    save(document: Document): Document {
        const result = this.db
            .prepare('INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)')
            .run(document.getUuid(), IntegrityStatusEnum.UNKNOWN, document.getProcessId());

        const id = result.lastInsertRowid as number;
        saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, document.getMetadata());

        return Document.fromDB({ id, uuid: document.getUuid(), processId: document.getProcessId() }, document.getMetadata());
    }

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
        this.db
            .prepare('UPDATE document SET integrity_status = ? WHERE id = ?')
            .run(status, id);
    }
}
