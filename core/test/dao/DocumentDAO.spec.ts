import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { DocumentDAO } from "../../src/dao/DocumentDAO";
import { Document } from "../../src/entity/Document";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";
import { createTestDb } from "./helpers/testDb";

function buildMetadata(title: string): Metadata {
  return new Metadata(
    "Documento",
    [
      new Metadata("Titolo", title, MetadataType.STRING),
      new Metadata(
        "Soggetto",
        [new Metadata("Nome", "Mario", MetadataType.STRING)],
        MetadataType.COMPOSITE,
      ),
    ],
    MetadataType.COMPOSITE,
  );
}

describe("DocumentDAO", () => {
  let db: Database.Database;
  let dao: DocumentDAO;
  let processUuid: string;
  let processId: number;

  beforeEach(() => {
    db = createTestDb();
    dao = new DocumentDAO(db);

    const dipId = Number(
      db
        .prepare("INSERT INTO dip (uuid, integrity_status) VALUES (?, ?)")
        .run("dip-doc-uuid", "UNKNOWN").lastInsertRowid,
    );
    const documentClassId = Number(
      db
        .prepare(
          "INSERT INTO document_class (dip_id, uuid, dipUuid, integrity_status, name, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          dipId,
          "dc-doc-uuid",
          "dip-doc-uuid",
          "UNKNOWN",
          "Classe",
          "2026-01-01",
        ).lastInsertRowid,
    );
    processId = Number(
      db
        .prepare(
          "INSERT INTO process (document_class_id, uuid, integrity_status) VALUES (?, ?, ?)",
        )
        .run(documentClassId, "proc-doc-uuid", "UNKNOWN").lastInsertRowid,
    );
    processUuid = "proc-doc-uuid";
  });

  afterEach(() => {
    db.close();
  });

  it("saves and retrieves document with metadata tree", () => {
    const entity = new Document("doc-a", buildMetadata("A"), processUuid);

    const saved = dao.save(entity);
    const found = dao.getById(saved.id);

    expect(found).not.toBeNull();
    expect(found?.uuid).toBe("doc-a");
    expect(found?.processId).toBe(processId);
    const parsed = JSON.parse(found?.metadataJson ?? "{}");
    expect(parsed.Documento?.Titolo).toBe("A");
  });

  it("gets by process and status and updates integrity", () => {
    const a = dao.save(new Document("doc-c", buildMetadata("C"), processUuid));
    const b = dao.save(new Document("doc-d", buildMetadata("D"), processUuid));

    dao.updateIntegrityStatus(a.id, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.id, IntegrityStatusEnum.INVALID);

    expect(dao.getByProcessId(processId)).toHaveLength(2);
    expect(dao.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(1);
    expect(dao.getByStatus(IntegrityStatusEnum.INVALID)).toHaveLength(1);
  });

  it("searchDocumentSemantic uses document_vector and returns top matches", async () => {
    const docA = dao.save(
      new Document("doc-sem-a", buildMetadata("A"), processUuid),
    );
    const docB = dao.save(
      new Document("doc-sem-b", buildMetadata("B"), processUuid),
    );

    const vecA = Buffer.from(new Float32Array([1, 0, 0]).buffer);
    const vecB = Buffer.from(new Float32Array([0, 1, 0]).buffer);

    db.prepare(
      "INSERT INTO document_vector (document_id, embedding) VALUES (?, ?)",
    ).run(docA.id, vecA);
    db.prepare(
      "INSERT INTO document_vector (document_id, embedding) VALUES (?, ?)",
    ).run(docB.id, vecB);

    const results = await dao.searchDocumentSemantic(
      new Float32Array([1, 0, 0]),
    );

    expect(results).toHaveLength(2);
    expect(results[0].row.uuid).toBe("doc-sem-a");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("getIndexedDocumentsCount reads from document_vector", () => {
    const doc = dao.save(
      new Document("doc-count", buildMetadata("C"), processUuid),
    );
    const vector = Buffer.from(new Float32Array([0.2, 0.4, 0.6]).buffer);

    db.prepare(
      "INSERT INTO document_vector (document_id, embedding) VALUES (?, ?)",
    ).run(doc.id, vector);

    expect(dao.getIndexedDocumentsCount()).toBe(1);
  });
});
