import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { DipDAO } from "../../src/dao/DipDAO";
import { Dip } from "../../src/entity/Dip";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { createTestDb } from "./helpers/testDb";

describe("DipDAO", () => {
  let db: Database.Database;
  let dao: DipDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new DipDAO({ db } as unknown as DatabaseProvider);
  });

  afterEach(() => {
    db.close();
  });

  it("saves dip with UNKNOWN status", () => {
    const dip = new Dip("dip-1", IntegrityStatusEnum.VALID);
    const saved = dao.save(dip);

    expect(saved.getId()).not.toBeNull();
    expect(saved.getUuid()).toBe("dip-1");
    expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("updates existing dip on uuid conflict", () => {
    const first = dao.save(new Dip("dip-2"));
    const second = dao.save(new Dip("dip-2", IntegrityStatusEnum.INVALID));

    const count = Number(
      (db.prepare("SELECT COUNT(*) as c FROM dip WHERE uuid = ?").get("dip-2") as { c: number }).c,
    );

    expect(count).toBe(1);
    expect(second.getId()).toBe(first.getId());
    expect(second.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("gets by id and uuid", () => {
    const saved = dao.save(new Dip("dip-3"));

    const byId = dao.getById(saved.getId() as number);
    const byUuid = dao.getByUuid("dip-3");

    expect(byId?.getUuid()).toBe("dip-3");
    expect(byUuid?.getId()).toBe(saved.getId());
  });

  it("filters by status and updates integrity", () => {
    const a = dao.save(new Dip("dip-a"));
    const b = dao.save(new Dip("dip-b"));

    dao.updateIntegrityStatus(a.getId() as number, IntegrityStatusEnum.VALID);
    dao.updateIntegrityStatus(b.getId() as number, IntegrityStatusEnum.INVALID);

    const valid = dao.getByStatus(IntegrityStatusEnum.VALID);
    const invalid = dao.getByStatus(IntegrityStatusEnum.INVALID);

    expect(valid.map((d) => d.getUuid())).toEqual(["dip-a"]);
    expect(invalid.map((d) => d.getUuid())).toEqual(["dip-b"]);
  });
});
