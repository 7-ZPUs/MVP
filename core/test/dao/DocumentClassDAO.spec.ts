import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { DocumentClassDAO } from "../../src/dao/DocumentClassDAO";
import { DocumentClass } from "../../src/entity/DocumentClass";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { createTestDb } from "./helpers/testDb";

describe("DocumentClassDAO", () => {
  let db: Database.Database;
  let dao: DocumentClassDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new DocumentClassDAO({ db } as unknown as DatabaseProvider);

    db.prepare("INSERT INTO dip (uuid, integrity_status) VALUES (?, ?)").run(
      "dip-uuid",
      "UNKNOWN",
    );
  });

  afterEach(() => {
    db.close();
  });

  it("saves and gets a document class", () => {
    const entity = new DocumentClass(
      "dip-uuid",
      "dc-uuid",
      "Classe A",
      "2026-01-01T00:00:00Z",
    );

    const saved = dao.save(entity);
    const found = dao.getById(saved.getId() as number);

    expect(saved.getId()).not.toBeNull();
    expect(found?.getUuid()).toBe("dc-uuid");
    expect(found?.getDipUuid()).toBe("dip-uuid");
  });

  it("updates by uuid conflict without duplicating rows", () => {
    dao.save(
      new DocumentClass("dip-uuid", "dc-unique", "Nome 1", "2026-01-01"),
    );
    dao.save(
      new DocumentClass("dip-uuid", "dc-unique", "Nome 2", "2026-01-02"),
    );

    const rows = db
      .prepare("SELECT id, name FROM document_class WHERE uuid = ?")
      .all("dc-unique") as Array<{ id: number; name: string }>;

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Nome 2");
  });

  it("gets by dipId, status and search", () => {
    const a = dao.save(
      new DocumentClass("dip-uuid", "dc-1", "Contratti", "2026-01-01"),
    );
    const b = dao.save(
      new DocumentClass("dip-uuid", "dc-2", "Fatture", "2026-01-01"),
    );

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);

    const dipId = a.getDipId() as number;

    expect(dao.getByDipId(dipId)).toHaveLength(2);
    expect(dao.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(1);
    expect(dao.search("Contr")).toHaveLength(1);
    expect(dao.search("NON-EXISTING")).toBeNull();
  });

  it("computes aggregated integrity status", () => {
    const a = dao.save(
      new DocumentClass("dip-uuid", "dc-agg-1", "A", "2026-01-01"),
    );
    const b = dao.save(
      new DocumentClass("dip-uuid", "dc-agg-2", "B", "2026-01-01"),
    );

    const dipId = a.getDipId() as number;

    expect(dao.getAggregatedIntegrityStatusByDipId(dipId)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.VALID);
    expect(dao.getAggregatedIntegrityStatusByDipId(dipId)).toBe(
      IntegrityStatusEnum.VALID,
    );

    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);
    expect(dao.getAggregatedIntegrityStatusByDipId(dipId)).toBe(
      IntegrityStatusEnum.INVALID,
    );
  });
});
