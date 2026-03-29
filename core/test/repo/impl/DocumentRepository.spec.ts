import { beforeEach, describe, expect, it, vi } from "vitest";

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

  // identifier: TU-F-browsing-55
  // method_name: save()
  // description: should successfully persist a document with complex metadata
  // expected_value: matches asserted behavior: successfully persist a document with complex metadata
  it("TU-F-browsing-55: save() should successfully persist a document with complex metadata", () => {
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

  // identifier: TU-S-browsing-56
  // method_name: save()
  // description: should handle updating an existing document
  // expected_value: matches asserted behavior: handle updating an existing document
  it("TU-S-browsing-56: save() should handle updating an existing document", () => {
    const doc = new Document("doc-unique", [], "process-uuid");
    repo.save(doc);

    const docUpdated = new Document(
      "doc-unique",
      [new Metadata("test", "val", MetadataType.STRING)],
      "process-uuid",
    );
    repo.save(docUpdated);

    const rows = db
      .prepare("SELECT * FROM document WHERE uuid = 'doc-unique'")
      .all();
    expect(rows).toHaveLength(1);
  });

  // identifier: TU-F-browsing-57
  // method_name: getByProcessId()
  // description: should return a list of documents
  // expected_value: returns a list of documents
  it("TU-F-browsing-57: getByProcessId() should return a list of documents", () => {
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-p1", IntegrityStatusEnum.UNKNOWN, 1);

    const results = repo.getByProcessId(1);
    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("doc-p1");
  });

  // identifier: TU-F-browsing-58
  // method_name: getByProcessId()
  // description: should return an empty array
  // expected_value: returns an empty array
  it("TU-F-browsing-58: getByProcessId() should return an empty array", () => {
    const results = repo.getByProcessId(999);
    expect(results).toHaveLength(0);
  });

  // identifier: TU-F-browsing-59
  // method_name: getByStatus()
  // description: should return documents
  // expected_value: returns documents
  it("TU-F-browsing-59: getByStatus() should return documents", () => {
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-s1", IntegrityStatusEnum.VALID, 1);
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-s2", IntegrityStatusEnum.INVALID, 1);

    const results = repo.getByStatus(IntegrityStatusEnum.VALID);
    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("doc-s1");
  });

  // identifier: TU-F-browsing-60
  // method_name: getByStatus()
  // description: should return an empty array
  // expected_value: returns an empty array
  it("TU-F-browsing-60: getByStatus() should return an empty array", () => {
    const results = repo.getByStatus(IntegrityStatusEnum.VALID);
    expect(results).toHaveLength(0);
  });

  // identifier: TU-S-browsing-61
  // method_name: updateIntegrityStatus()
  // description: should successfully update the status
  // expected_value: matches asserted behavior: successfully update the status
  it("TU-S-browsing-61: updateIntegrityStatus() should successfully update the status", () => {
    const insertResult = db
      .prepare(
        "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
      )
      .run("doc-u1", IntegrityStatusEnum.UNKNOWN, 1);
    const docId = insertResult.lastInsertRowid as number;

    repo.updateIntegrityStatus(docId, IntegrityStatusEnum.VALID);

    const row = db
      .prepare("SELECT integrity_status FROM document WHERE id = ?")
      .get(docId) as any;
    expect(row.integrity_status).toBe(IntegrityStatusEnum.VALID);
  });

  // identifier: TU-S-browsing-62
  // method_name: save()
  // description: should fallback to select
  // expected_value: matches asserted behavior: fallback to select
  it("TU-S-browsing-62: save() should fallback to select", () => {
    const originalPrepare = db.prepare.bind(db);
    const prepareSpy = vi
      .spyOn(db, "prepare")
      .mockImplementation((query: string) => {
        if (query.includes("INSERT INTO document")) {
          const stmt = originalPrepare(query);
          const originalRun = stmt.run.bind(stmt);
          stmt.run = (...args: any[]) => {
            originalRun(...args);
            return { lastInsertRowid: 0, changes: 0 };
          };
          return stmt;
        }
        return originalPrepare(query);
      });

    const doc = new Document("doc-fallback", [], "process-uuid");
    const saved = repo.save(doc);

    expect(saved.getUuid()).toBe("doc-fallback");
    expect(saved.toDTO().id).toBeGreaterThan(0);
    prepareSpy.mockRestore();
  });

  // identifier: TU-F-browsing-63
  // method_name: getAggregatedIntegrityStatusByProcessId()
  // description: should returns correctly
  // expected_value: matches asserted behavior: getAggregatedIntegrityStatusByProcessId() returns correctly
  it("TU-F-browsing-63: getAggregatedIntegrityStatusByProcessId() should returns correctly", () => {
    // Initially empty
    expect(repo.getAggregatedIntegrityStatusByProcessId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // Add a valid doc
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-agg-1", IntegrityStatusEnum.VALID, 1);
    expect(repo.getAggregatedIntegrityStatusByProcessId(1)).toBe(
      IntegrityStatusEnum.VALID,
    );

    // Add an unknown doc
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-agg-2", IntegrityStatusEnum.UNKNOWN, 1);
    expect(repo.getAggregatedIntegrityStatusByProcessId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // Add an invalid doc
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-agg-3", IntegrityStatusEnum.INVALID, 1);
    expect(repo.getAggregatedIntegrityStatusByProcessId(1)).toBe(
      IntegrityStatusEnum.INVALID,
    );
  });
});
