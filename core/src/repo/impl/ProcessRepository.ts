import Database from "better-sqlite3";
import { inject, injectable } from "tsyringe";
import { IProcessRepository } from "../IProcessRepository";
import { DATABASE_PROVIDER_TOKEN, DatabaseProvider } from "./DatabaseProvider";
import { Process, ProcessRow } from "../../entity/Process";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { loadMetadata, saveMetadata } from './MetadataHelper';
import { CreateProcessDTO } from "../../dto/ProcessDTO";
import { Metadata } from "../../value-objects/Metadata";

const METADATA_TABLE = 'process_metadata';
const METADATA_FK = 'process_id';

@injectable()
export class ProcessRepository implements IProcessRepository {
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
            CREATE TABLE IF NOT EXISTS process (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                document_class_id INTEGER NOT NULL REFERENCES document_class(id) ON DELETE CASCADE,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN'
            );
            CREATE TABLE IF NOT EXISTS process_metadata (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                process_id   INTEGER NOT NULL REFERENCES process(id) ON DELETE CASCADE,
                name        TEXT    NOT NULL,
                value       TEXT    NOT NULL,
                type        TEXT    NOT NULL DEFAULT 'string'
            );

            CREATE INDEX IF NOT EXISTS idx_process_document_class_id
                ON process (document_class_id);

            CREATE INDEX IF NOT EXISTS idx_process_integrity_status
                ON process (integrity_status);

            CREATE INDEX IF NOT EXISTS idx_process_metadata_process_id
                ON process_metadata (process_id);
        `);
    }

    private rowToEntity(row: ProcessRow): Process {
        const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
        return Process.fromDB(row, metadata);
    }

    getById(id: number): Process | null {
        const row = this.db
            .prepare<[number], ProcessRow>(
                'SELECT id, document_class_id as documentClassId, uuid, integrity_status as integrityStatus FROM process WHERE id = ?'
            )
            .get(id);
        return row ? this.rowToEntity(row) : null;
    }

    getByDocumentClassId(documentClassId: number): Process[] {
        const rows = this.db
            .prepare<[number], ProcessRow>(
                'SELECT id, document_class_id as documentClassId, uuid, integrity_status as integrityStatus FROM process WHERE document_class_id = ? ORDER BY id'
            )
            .all(documentClassId);
        return rows.map((r) => this.rowToEntity(r));
    }

    getByStatus(status: IntegrityStatusEnum): Process[] {
        const rows = this.db
            .prepare<[string], ProcessRow>(
                'SELECT id, document_class_id as documentClassId, uuid, integrity_status as integrityStatus FROM process WHERE integrity_status = ? ORDER BY id'
            )
            .all(status);
        return rows.map((r) => this.rowToEntity(r));
    }

    save(dto: CreateProcessDTO): Process {
        const metadata = dto.metadata.map((m) => new Metadata(m.name, m.value, m.type));

        const result = this.db
            .prepare('INSERT INTO process (document_class_id, uuid, integrity_status) VALUES (?, ?, ?)')
            .run(dto.documentClassId, dto.uuid, IntegrityStatusEnum.UNKNOWN);

        const id = result.lastInsertRowid as number;
        saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, metadata);

        return Process.fromDB(
            {
                id,
                documentClassId: dto.documentClassId,
                uuid: dto.uuid,
                integrityStatus: IntegrityStatusEnum.UNKNOWN,
            },
            metadata
        );
    }

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
        this.db
            .prepare('UPDATE process SET integrity_status = ? WHERE id = ?')
            .run(status, id);
    }
}