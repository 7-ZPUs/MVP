import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DipRepository } from "../../src/repo/impl/DipRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { Dip } from "../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

vi.mock("better-sqlite3", () => {
  const { DatabaseSync } = require("node:sqlite");
  class FakeDatabase {
    private _db: InstanceType<typeof DatabaseSync>;
    constructor(_path: string) {
      this._db = new DatabaseSync(":memory:");
    }
    pragma() {}
    exec(sql: string) { return this._db.exec(sql); }
    prepare(sql: string) { return this._db.prepare(sql); }
  }
  return { default: FakeDatabase };
});

describe("DipRepository", () => {
  let repo: DipRepository;

  beforeEach(() => {
    repo = new DipRepository(new DatabaseProvider());
  });

  describe("save", () => {
    it("should persist a Dip and return it with an assigned id", () => {
      const dip = new Dip("uuid-001");
      const saved = repo.save(dip);

      expect(saved.getId()).toBe(1);
      expect(saved.getUuid()).toBe("uuid-001");
      expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("should assign incremental ids", () => {
      const first = repo.save(new Dip("uuid-001"));
      const second = repo.save(new Dip("uuid-002"));

      expect(first.getId()).toBe(1);
      expect(second.getId()).toBe(2);
    });
  });

  describe("getById", () => {
    it("should return the Dip when it exists", () => {
      repo.save(new Dip("uuid-001"));

      const found = repo.getById(1);

      expect(found).not.toBeNull();
      expect(found!.getUuid()).toBe("uuid-001");
    });

    it("should return null when not found", () => {
      expect(repo.getById(999)).toBeNull();
    });
  });

  describe("getByUuid", () => {
    it("should return the Dip matching the uuid", () => {
      repo.save(new Dip("uuid-001"));

      const found = repo.getByUuid("uuid-001");

      expect(found).not.toBeNull();
      expect(found!.getId()).toBe(1);
    });

    it("should return null for a non-existent uuid", () => {
      expect(repo.getByUuid("nonexistent")).toBeNull();
    });
  });

  describe("getByStatus", () => {
    it("should return all Dips with matching status", () => {
      repo.save(new Dip("uuid-001"));
      repo.save(new Dip("uuid-002"));

      const results = repo.getByStatus(IntegrityStatusEnum.UNKNOWN);

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no Dips match the status", () => {
      repo.save(new Dip("uuid-001"));

      expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
    });
  });

  describe("updateIntegrityStatus", () => {
    it("should change the integrity status of a Dip", () => {
      repo.save(new Dip("uuid-001"));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.VALID);

      const updated = repo.getById(1);
      expect(updated!.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });

    it("should not affect other Dips", () => {
      repo.save(new Dip("uuid-001"));
      repo.save(new Dip("uuid-002"));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.INVALID);

      expect(repo.getById(1)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
      expect(repo.getById(2)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });
});
