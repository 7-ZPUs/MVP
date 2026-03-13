/**
 * FileRepository — Infrastructure Repository (SQLite)
 *
 * Implementa IFileRepository usando better-sqlite3.
 * Zero business logic: solo persistenza.
 *
 * Schema gestito:
 *   file  (id, filename, path, integrity_status, is_main, document_id)
 */
import { inject, injectable } from 'tsyringe';
import Database from 'better-sqlite3';

import { File, FileRow } from '../../entity/File';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';
import type { IFileRepository } from '../IFileRepository';
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from './DatabaseProvider';
import { CreateFileDTO } from '../../dto/FileDTO';

@injectable()
export class FileRepository implements IFileRepository {
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
            CREATE TABLE IF NOT EXISTS file (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                filename         TEXT    NOT NULL,
                path             TEXT    NOT NULL,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN',
                is_main          INTEGER NOT NULL DEFAULT 0,
                document_id      INTEGER NOT NULL REFERENCES documento(id) ON DELETE CASCADE
            );
        `);
    }

    // -------------------------------------------------------------------------
    // IFileRepository implementation
    // -------------------------------------------------------------------------

    getById(id: number): File | null {
        const row = this.db
            .prepare<[number], FileRow>(
                `SELECT id, filename, path, integrity_status as integrityStatus,
                        is_main as isMain, document_id as documentId
                 FROM file WHERE id = ?`
            )
            .get(id);
        return row ? File.fromDB(row) : null;
    }

    getByDocumentId(documentId: number): File[] {
        const rows = this.db
            .prepare<[number], FileRow>(
                `SELECT id, filename, path, integrity_status as integrityStatus,
                        is_main as isMain, document_id as documentId
                 FROM file WHERE document_id = ? ORDER BY is_main DESC, id`
            )
            .all(documentId);
        return rows.map((r) => File.fromDB(r));
    }

    getByStatus(status: IntegrityStatusEnum): File[] {
        const rows = this.db
            .prepare<[string], FileRow>(
                `SELECT id, filename, path, integrity_status as integrityStatus,
                        is_main as isMain, document_id as documentId
                 FROM file WHERE integrity_status = ? ORDER BY id`
            )
            .all(status);
        return rows.map((r) => File.fromDB(r));
    }

    save(dto: CreateFileDTO): File {
        const result = this.db
            .prepare(
                `INSERT INTO file (filename, path, integrity_status, is_main, document_id)
                 VALUES (?, ?, ?, ?, ?)`
            )
            .run(
                dto.filename,
                dto.path,
                IntegrityStatusEnum.UNKNOWN,
                dto.isMain ? 1 : 0,
                dto.documentId
            );

        return File.fromDB({
            id: result.lastInsertRowid as number,
            filename: dto.filename,
            path: dto.path,
            integrityStatus: IntegrityStatusEnum.UNKNOWN,
            isMain: dto.isMain ? 1 : 0,
            documentId: dto.documentId,
        });
    }

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
        this.db
            .prepare('UPDATE file SET integrity_status = ? WHERE id = ?')
            .run(status, id);
    }
}
