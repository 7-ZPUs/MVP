/**
 * DocumentoRepository — Infrastructure Repository (SQLite)
 *
 * Implementa IDocumentoRepository usando better-sqlite3.
 * Zero business logic: solo persistenza.
 *
 * Schema gestito:
 *   documento            (id, uuid, integrity_status, process_id)
 *   documento_metadata   (id, document_id, name, value, type)
 */
import { inject, injectable } from 'tsyringe';
import Database from 'better-sqlite3';

import { Documento, DocumentoRow } from '../../entity/Document';
import { Metadata } from '../../value-objects/Metadata';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';
import type { IDocumentoRepository } from '../IDocumentoRepository';
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from './DatabaseProvider';

interface MetadataRow {
    id: number;
    document_id: number;
    name: string;
    value: string;
    type: string;
}

@injectable()
export class DocumentoRepository implements IDocumentoRepository {
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
            CREATE TABLE IF NOT EXISTS documento (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN',
                process_id       INTEGER
            );

            CREATE TABLE IF NOT EXISTS documento_metadata (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES documento(id) ON DELETE CASCADE,
                name        TEXT    NOT NULL,
                value       TEXT    NOT NULL,
                type        TEXT    NOT NULL DEFAULT 'string'
            );
        `);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private loadMetadata(documentId: number): Metadata[] {
        const rows = this.db
            .prepare<[number], MetadataRow>(
                'SELECT * FROM documento_metadata WHERE document_id = ? ORDER BY id'
            )
            .all(documentId);
        return rows.map((r) => new Metadata(r.name, r.value, r.type as Metadata['type']));
    }

    private saveMetadata(documentId: number, metadata: Metadata[]): void {
        const stmt = this.db.prepare(
            'INSERT INTO documento_metadata (document_id, name, value, type) VALUES (?, ?, ?, ?)'
        );
        for (const m of metadata) {
            stmt.run(documentId, m.name, m.value, m.type);
        }
    }

    private rowToEntity(row: DocumentoRow): Documento {
        const metadata = this.loadMetadata(row.id);
        return Documento.fromDB(row, metadata);
    }

    // -------------------------------------------------------------------------
    // IDocumentoRepository implementation
    // -------------------------------------------------------------------------

    getById(id: number): Documento | null {
        const row = this.db
            .prepare<[number], DocumentoRow>(
                `SELECT id, uuid, integrity_status as integrityStatus
                 FROM documento WHERE id = ?`
            )
            .get(id);
        return row ? this.rowToEntity(row) : null;
    }

    getByProcessId(processId: number): Documento[] {
        const rows = this.db
            .prepare<[number], DocumentoRow>(
                `SELECT id, uuid, integrity_status as integrityStatus
                 FROM documento WHERE process_id = ? ORDER BY id`
            )
            .all(processId);
        return rows.map((r) => this.rowToEntity(r));
    }

    getByStatus(status: IntegrityStatusEnum): Documento[] {
        const rows = this.db
            .prepare<[string], DocumentoRow>(
                `SELECT id, uuid, integrity_status as integrityStatus
                 FROM documento WHERE integrity_status = ? ORDER BY id`
            )
            .all(status);
        return rows.map((r) => this.rowToEntity(r));
    }

    save(documento: Documento): Documento {
        const result = this.db
            .prepare('INSERT INTO documento (uuid, integrity_status) VALUES (?, ?)')
            .run(documento.getUuid(), IntegrityStatusEnum.UNKNOWN);

        const id = result.lastInsertRowid as number;
        this.saveMetadata(id, documento.getMetadata());

        return Documento.fromDB({ id, uuid: documento.getUuid() }, documento.getMetadata());
    }

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
        this.db
            .prepare('UPDATE documento SET integrity_status = ? WHERE id = ?')
            .run(status, id);
    }
}
