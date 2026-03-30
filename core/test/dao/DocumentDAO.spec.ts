import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { DocumentDAO } from "../../src/dao/DocumentDAO";
import { Document } from "../../src/entity/Document";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";
import { createTestDb } from "./helpers/testDb";

describe("DocumentDAO", () => {
  let db: Database.Database;
  let dao: DocumentDAO;
  let processUuid: string;
  let processId: number;

  beforeEach(() => {
    db = createTestDb();
    dao = new DocumentDAO({ db } as unknown as DatabaseProvider);

    const dipId = Number(
      db.prepare("INSERT INTO dip (uuid, integrity_status) VALUES (?, ?)")
        .run("dip-doc-uuid", "UNKNOWN").lastInsertRowid,
    );
    const documentClassId = Number(
      db.prepare(
        "INSERT INTO document_class (dip_id, uuid, integrity_status, name, timestamp) VALUES (?, ?, ?, ?, ?)",
      )
        .run(dipId, "dc-doc-uuid", "UNKNOWN", "Classe", "2026-01-01")
        .lastInsertRowid,
    );
    processId = Number(
      db.prepare(
        "INSERT INTO process (document_class_id, uuid, integrity_status) VALUES (?, ?, ?)",
      )
        .run(documentClassId, "proc-doc-uuid", "UNKNOWN")
        .lastInsertRowid,
    );
    processUuid = "proc-doc-uuid";
  });

  afterEach(() => {
    db.close();
  });

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

  it("saves and retrieves document with metadata tree", () => {
    const entity = new Document("doc-a", buildMetadata("A"), processUuid);

    const saved = dao.save(entity);
    const found = dao.getById(saved.getId() as number);

    expect(found).not.toBeNull();
    expect(found?.getUuid()).toBe("doc-a");
    expect(found?.getProcessId()).toBe(processId);
    expect(found?.getMetadata().findNodeByName("Titolo")?.getStringValue()).toBe(
      "A",
    );
  });

  it("updates document and rewrites metadata on uuid conflict", () => {
    dao.save(new Document("doc-b", buildMetadata("OLD"), processUuid));
    const updated = dao.save(new Document("doc-b", buildMetadata("NEW"), processUuid));

    const found = dao.getById(updated.getId() as number);
    expect(found?.getMetadata().findNodeByName("Titolo")?.getStringValue()).toBe(
      "NEW",
    );
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

  it("computes aggregated integrity status", () => {
    const a = dao.save(new Document("doc-e", buildMetadata("E"), processUuid));
    const b = dao.save(new Document("doc-f", buildMetadata("F"), processUuid));

    expect(dao.getAggregatedIntegrityStatusByProcessId(processId)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.VALID);
    expect(dao.getAggregatedIntegrityStatusByProcessId(processId)).toBe(
      IntegrityStatusEnum.VALID,
    );

    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);
    expect(dao.getAggregatedIntegrityStatusByProcessId(processId)).toBe(
      IntegrityStatusEnum.INVALID,
    );
  });
});
