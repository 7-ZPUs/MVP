import Database from "better-sqlite3";
import { injectable, inject } from "tsyringe";
import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";
import { FilePersistenceRow, FileMapper } from "./mappers/FileMapper";
import { File } from "../entity/File";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { IFileDAO } from "./IFileDAO";

@injectable()
export class FileDAO implements IFileDAO {
  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  private rowEntity(row: FilePersistenceRow): File {
    return FileMapper.fromPersistence(row);
  }

  getById(id: number): File | null {
    const row = this.db
      .prepare<[number], FilePersistenceRow>(
        `SELECT id, filename, path, hash, integrity_status as integrityStatus,
                    is_main as isMain, document_id as documentId
                 FROM file WHERE id = ?`,
      )
      .get(id);
    return row ? this.rowEntity(row) : null;
  }

  getByDocumentId(documentId: number): File[] {
    const rows = this.db
      .prepare<[number], FilePersistenceRow>(
        `SELECT id, filename, path, hash, integrity_status as integrityStatus,
                    is_main as isMain, document_id as documentId
                 FROM file WHERE document_id = ? ORDER BY is_main DESC, id`,
      )
      .all(documentId);
    return rows.map((r) => this.rowEntity(r));
  }

  getByStatus(status: IntegrityStatusEnum): File[] {
    const rows = this.db
      .prepare<[string], FilePersistenceRow>(
        `SELECT id, filename, path, hash, integrity_status as integrityStatus,
                    is_main as isMain, document_id as documentId
                 FROM file WHERE integrity_status = ? ORDER BY id`,
      )
      .all(status);
    return rows.map((r) => this.rowEntity(r));
  }

  save(file: File): File {
    const result = this.db
      .prepare(
        `INSERT INTO file (filename, path, hash, integrity_status, is_main, document_id)
                 VALUES (?, ?, ?, ?, ?, (SELECT id FROM document WHERE uuid = ?))
                 ON CONFLICT(document_id, path) DO UPDATE SET
                    filename = excluded.filename,
                    hash = excluded.hash,
                    integrity_status = excluded.integrity_status,
                    is_main = excluded.is_main`,
      )
      .run(
        file.getFilename(),
        file.getPath(),
        file.getHash(),
        IntegrityStatusEnum.UNKNOWN,
        file.getIsMain() ? 1 : 0,
        file.getDocumentUuid(),
      );

    let id = result.lastInsertRowid as number;
    if (!id) {
      const docIdRow = this.db
        .prepare("SELECT id FROM document WHERE uuid = ?")
        .get(file.getDocumentUuid()) as { id: number } | undefined;
      if (docIdRow) {
        const row = this.db
          .prepare("SELECT id FROM file WHERE document_id = ? AND path = ?")
          .get(docIdRow.id, file.getPath()) as { id: number };
        if (row) id = row.id;
      }
    }

    const saved = this.getById(id);
    if (!saved) {
      throw new Error(`Failed to save File with uuid=${file.getUuid()}`);
    }
    return saved;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE file SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }
}
