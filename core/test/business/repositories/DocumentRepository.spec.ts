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
    // Create necessary tables for testing
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

  it("save persiste documento e metadata", () => {
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

    // EXPORT DB ROWS FOR DEBUGGING
    const docRows = db.prepare("SELECT * FROM document").all();
    const metaRows = db.prepare("SELECT * FROM document_metadata").all();
    console.log("DOCUMENT ROWS:", JSON.stringify(docRows, null, 2));
    console.log("METADATA ROWS:", JSON.stringify(metaRows, null, 2));

    const found = repo.getById(saved.toDTO().id);

    expect(found).not.toBeNull();
    expect(found?.getUuid()).toBe("doc-1");
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(found?.getMetadata()).toHaveLength(3);
    expect(found?.getMetadata()[0].name).toBe("titolo");
    expect(found?.getMetadata()[2].name).toBe("soggetto");
    expect(found?.getMetadata()[2].type).toBe(MetadataType.COMPOSITE);
    expect(Array.isArray(found?.getMetadata()[2].value)).toBe(true);
    expect((found?.getMetadata()[2].value as Metadata[])[0].name).toBe("nome");
    expect((found?.getMetadata()[2].value as Metadata[])[0].value).toBe(
      "Mario",
    );
  });

  it("getByProcessId, getByStatus e updateIntegrityStatus funzionano", () => {
    // Setup data
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    ).run("doc-2", IntegrityStatusEnum.VALID, 1);

    expect(repo.getByProcessId(1)).toHaveLength(1);

    const docId = (
      db.prepare("SELECT id FROM document WHERE uuid = ?").get("doc-2") as any
    ).id;
    repo.updateIntegrityStatus(docId, IntegrityStatusEnum.VALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].getUuid()).toBe("doc-2");
    expect(byStatus[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
  });
});
