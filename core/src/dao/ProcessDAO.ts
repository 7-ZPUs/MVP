import Database from "better-sqlite3";
import { injectable, inject } from "tsyringe";
import {
  DATABASE_PROVIDER_TOKEN,
  DatabaseProvider,
} from "../repo/impl/DatabaseProvider";
import { Process } from "../entity/Process";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { ProcessMapper, ProcessPersistenceRow } from "./mappers/ProcessMapper";
import { loadMetadata, saveMetadata } from "./MetadataHelper";
import { IProcessDAO } from "./IProcessDAO";

const METADATA_TABLE = "process_metadata";
const METADATA_FK = "process_id";

@injectable()
export class ProcessDAO implements IProcessDAO {
  private readonly db: Database.Database;

  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
  ) {
    this.db = dbProvider.db;
  }

  private rowToEntity(row: ProcessPersistenceRow): Process {
    const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
    return ProcessMapper.fromPersistence(row, metadata);
  }

  getById(id: number): Process | null {
    const row = this.db
      .prepare<
        [number],
        ProcessPersistenceRow
      >("SELECT id, document_class_id as documentClassId, uuid, integrity_status as integrityStatus FROM process WHERE id = ?")
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByDocumentClassId(documentClassId: number): Process[] {
    const rows = this.db
      .prepare<
        [number],
        ProcessPersistenceRow
      >("SELECT id, document_class_id as documentClassId, uuid, integrity_status as integrityStatus FROM process WHERE document_class_id = ? ORDER BY id")
      .all(documentClassId);
    return rows.map((r) => this.rowToEntity(r));
  }

  getByStatus(status: IntegrityStatusEnum): Process[] {
    const rows = this.db
      .prepare<
        [string],
        ProcessPersistenceRow
      >("SELECT id, document_class_id as documentClassId, uuid, integrity_status as integrityStatus FROM process WHERE integrity_status = ? ORDER BY id")
      .all(status);
    return rows.map((r) => this.rowToEntity(r));
  }

  save(process: Process): Process {
    const metadata = process.getMetadata();

    const result = this.db
      .prepare(
        `INSERT INTO process (document_class_id, uuid, integrity_status) 
         VALUES ((SELECT id FROM document_class WHERE uuid = ?), ?, ?)
         ON CONFLICT(uuid) DO UPDATE SET
            document_class_id = excluded.document_class_id,
            integrity_status = excluded.integrity_status`,
      )
      .run(
        process.getDocumentClassUuid(),
        process.getUuid(),
        IntegrityStatusEnum.UNKNOWN,
      );

    let id = result.lastInsertRowid as number;

    if (!id) {
      const row = this.db
        .prepare("SELECT id FROM process WHERE uuid = ?")
        .get(process.getUuid()) as { id: number };
      if (row) {
        id = row.id;
      }
    }

    // Clean up existing metadata to avoid duplicates
    this.db
      .prepare(`DELETE FROM ${METADATA_TABLE} WHERE ${METADATA_FK} = ?`)
      .run(id);

    saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, metadata);

    const saved = this.getById(id);
    if (!saved) {
      throw new Error(`Failed to save Process with uuid=${process.getUuid()}`);
    }
    return saved;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE process SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }
}
