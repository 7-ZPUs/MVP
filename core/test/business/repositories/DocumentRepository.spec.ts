import { beforeEach, describe, expect, it } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { Document } from "../../../src/entity/Document";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";
import Database from "better-sqlite3";

describe("DocumentRepository", () => {
  let db: Database.Database;
  let repo: DocumentRepository;

  beforeEach(() => {
    db = new Database("test.db");
    db.exec(`
      DROP TABLE IF EXISTS document_metadata;
      DROP TABLE IF EXISTS document;
      DROP TABLE IF EXISTS process;
      CREATE TABLE IF NOT EXISTS process (
          id   INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT    NOT NULL UNIQUE
      );
      INSERT INTO process (uuid) VALUES ('process-uuid');
    `);
    repo = new DocumentRepository({ db } as unknown as DatabaseProvider);
  });

  it("TU-F-B-01: save() with valid document should successfully persist a document with complex metadata", () => {
    const metadata = [
      new Metadata("titolo", "Documento A", MetadataType.STRING),
      new Metadata("anno", "2026", MetadataType.NUMBER),
      new Metadata(
        "soggetto",
        [new Metadata("nome", "Mario", MetadataType.STRING)],
        MetadataType.COMPOSITE,
      ),
    ];

    const document = new Document("doc-1", metadata, "process-uuid");
    const saved = repo.save(document);
    const found = repo.getById(saved.toDTO().id);

    expect(found).not.toBeNull();
    expect(found?.getUuid()).toBe("doc-1");
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(found?.getMetadata()).toHaveLength(3);
    expect(found?.getMetadata()[2].type).toBe(MetadataType.COMPOSITE);
  });

  it("TU-F-B-02: save() with existing UUID should handle updating an existing document", () => {
    const doc = new Document("doc-unique", [], "process-uuid");
    repo.save(doc);
    
    const docUpdated = new Document("doc-unique", [new Metadata("test", "val", MetadataType.STRING)], "process-uuid");
    repo.save(docUpdated);

    const rows = db.prepare("SELECT * FROM document WHERE uuid = 'doc-unique'").all();
    expect(rows).toHaveLength(1);
  });

  it("TU-F-B-03: getByProcessId() with valid process ID should return a list of documents", () => {
    db.prepare("INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)").run("doc-p1", IntegrityStatusEnum.UNKNOWN, 1);
    
    const results = repo.getByProcessId(1);
    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("doc-p1");
  });

  it("TU-F-B-04: getByProcessId() with non-existent process ID should return an empty array", () => {
    const results = repo.getByProcessId(999);
    expect(results).toHaveLength(0);
  });

  it("TU-F-B-05: getByStatus() with matching integrity status should return documents", () => {
    db.prepare("INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)").run("doc-s1", IntegrityStatusEnum.VALID, 1);
    db.prepare("INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)").run("doc-s2", IntegrityStatusEnum.INVALID, 1);
    
    const results = repo.getByStatus(IntegrityStatusEnum.VALID);
    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("doc-s1");
  });

  it("TU-F-B-06: getByStatus() with no matching documents should return an empty array", () => {
    const results = repo.getByStatus(IntegrityStatusEnum.VALID);
    expect(results).toHaveLength(0);
  });

  it("TU-F-B-07: updateIntegrityStatus() with valid document ID should successfully update the status", () => {
    const insertResult = db.prepare("INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)").run("doc-u1", IntegrityStatusEnum.UNKNOWN, 1);
    const docId = insertResult.lastInsertRowid as number;

    repo.updateIntegrityStatus(docId, IntegrityStatusEnum.VALID);
    
    const row = db.prepare("SELECT integrity_status FROM document WHERE id = ?").get(docId) as any;
    expect(row.integrity_status).toBe(IntegrityStatusEnum.VALID);
  });
});
