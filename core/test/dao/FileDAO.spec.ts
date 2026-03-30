import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { FileDAO } from "../../src/dao/FileDAO";
import { File } from "../../src/entity/File";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { createTestDb, seedHierarchy } from "./helpers/testDb";

describe("FileDAO", () => {
  let db: Database.Database;
  let dao: FileDAO;
  let documentUuid: string;
  let documentId: number;

  beforeEach(() => {
    db = createTestDb();
    dao = new FileDAO({ db } as unknown as DatabaseProvider);

    const seed = seedHierarchy(db);
    documentUuid = seed.documentUuid;
    documentId = seed.documentId;
  });

  afterEach(() => {
    db.close();
  });

  it("saves and retrieves file", () => {
    const file = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash-main",
      true,
      "file-main",
      documentUuid,
    );

    const saved = dao.save(file);
    const found = dao.getById(saved.getId() as number);

    expect(found).not.toBeNull();
    expect(found?.getFilename()).toBe("main.xml");
    expect(found?.getDocumentId()).toBe(documentId);
    expect(found?.getIsMain()).toBe(true);
  });

  it("updates on (document_id, path) conflict without duplicating rows", () => {
    dao.save(
      new File(
        "main.xml",
        "/pkg/main.xml",
        "hash-old",
        true,
        "file-main",
        documentUuid,
      ),
    );

    const updated = dao.save(
      new File(
        "main-v2.xml",
        "/pkg/main.xml",
        "hash-new",
        true,
        "file-main",
        documentUuid,
      ),
    );

    const rows = db
      .prepare("SELECT id, filename, hash FROM file WHERE document_id = ? AND path = ?")
      .all(documentId, "/pkg/main.xml") as Array<{
      id: number;
      filename: string;
      hash: string;
    }>;

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(updated.getId());
    expect(rows[0].filename).toBe("main-v2.xml");
    expect(rows[0].hash).toBe("hash-new");
  });

  it("gets by document and status and updates integrity", () => {
    const a = dao.save(
      new File("a.xml", "/pkg/a.xml", "ha", true, "file-a", documentUuid),
    );
    const b = dao.save(
      new File("b.xml", "/pkg/b.xml", "hb", false, "file-b", documentUuid),
    );

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);

    expect(dao.getByDocumentId(documentId)).toHaveLength(2);
    expect(dao.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(1);
    expect(dao.getByStatus(IntegrityStatusEnum.INVALID)).toHaveLength(1);
  });

  it("computes aggregated integrity status", () => {
    const a = dao.save(
      new File("c.xml", "/pkg/c.xml", "hc", true, "file-c", documentUuid),
    );
    const b = dao.save(
      new File("d.xml", "/pkg/d.xml", "hd", false, "file-d", documentUuid),
    );

    expect(dao.getAggregatedIntegrityStatusByDocumentId(documentId)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.VALID);
    expect(dao.getAggregatedIntegrityStatusByDocumentId(documentId)).toBe(
      IntegrityStatusEnum.VALID,
    );

    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);
    expect(dao.getAggregatedIntegrityStatusByDocumentId(documentId)).toBe(
      IntegrityStatusEnum.INVALID,
    );
  });
});
