import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { ProcessDAO } from "../../src/dao/ProcessDAO";
import { Process } from "../../src/entity/Process";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";
import { createTestDb } from "./helpers/testDb";

describe("ProcessDAO", () => {
  let db: Database.Database;
  let dao: ProcessDAO;
  let documentClassUuid: string;
  let documentClassId: number;

  beforeEach(() => {
    db = createTestDb();
    dao = new ProcessDAO(db);

    const dipId = Number(
      db
        .prepare("INSERT INTO dip (uuid, integrity_status) VALUES (?, ?)")
        .run("dip-proc-uuid", "UNKNOWN").lastInsertRowid,
    );
    documentClassId = Number(
      db
        .prepare(
          "INSERT INTO document_class (dip_id, uuid, dipUuid, integrity_status, name, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          dipId,
          "dc-proc-uuid",
          "dip-proc-uuid",
          "UNKNOWN",
          "Classe",
          "2026-01-01",
        ).lastInsertRowid,
    );
    documentClassUuid = "dc-proc-uuid";
  });

  afterEach(() => {
    db.close();
  });

  function buildMetadata(version: string): Metadata {
    return new Metadata(
      "Process",
      [
        new Metadata("Versione", version, MetadataType.STRING),
        new Metadata(
          "Dettagli",
          [new Metadata("Step", "1", MetadataType.STRING)],
          MetadataType.COMPOSITE,
        ),
      ],
      MetadataType.COMPOSITE,
    );
  }

  it("saves and retrieves process with metadata tree", () => {
    const entity = new Process(
      documentClassUuid,
      "proc-a",
      buildMetadata("v1"),
    );

    const saved = dao.save(entity);
    const found = dao.getById(saved.getId() as number);

    expect(found).not.toBeNull();
    expect(found?.getUuid()).toBe("proc-a");
    expect(found?.getDocumentClassId()).toBe(documentClassId);
    expect(found?.getMetadata().getName()).toBe("Process");
    expect(
      found?.getMetadata().findNodeByName("Versione")?.getStringValue(),
    ).toBe("v1");
  });

  it("gets by documentClassId and status and updates integrity", () => {
    const a = dao.save(
      new Process(documentClassUuid, "proc-c", buildMetadata("v1")),
    );
    const b = dao.save(
      new Process(documentClassUuid, "proc-d", buildMetadata("v1")),
    );

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);

    expect(dao.getByDocumentClassId(documentClassId)).toHaveLength(2);
    expect(dao.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(1);
    expect(dao.getByStatus(IntegrityStatusEnum.INVALID)).toHaveLength(1);
  });
});
