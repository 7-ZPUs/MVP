import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { DocumentDAO } from "../../src/dao/DocumentDAO";
import { Document } from "../../src/entity/Document";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
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
    dao = new DocumentDAO({ getDb: () => db } as unknown as DatabaseProvider);

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
    const found = dao.getById(saved.getId() as number);

    expect(found).not.toBeNull();
    expect(found?.getUuid()).toBe("doc-a");
    expect(found?.getProcessId()).toBe(processId);
    expect(
      found?.getMetadata().findNodeByName("Titolo")?.getStringValue(),
    ).toBe("A");
  });

  it("gets by process and status and updates integrity", () => {
    const a = dao.save(new Document("doc-c", buildMetadata("C"), processUuid));
    const b = dao.save(new Document("doc-d", buildMetadata("D"), processUuid));

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);

    expect(dao.getByProcessId(processId)).toHaveLength(2);
    expect(dao.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(1);
    expect(dao.getByStatus(IntegrityStatusEnum.INVALID)).toHaveLength(1);
  });
});
