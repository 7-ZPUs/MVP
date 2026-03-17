import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DocumentClassRepository } from "../../src/repo/impl/DocumentClassRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { DocumentClass } from "../../src/entity/DocumentClass";
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

describe("DocumentClassRepository", () => {
  let repo: DocumentClassRepository;

  beforeEach(() => {
    repo = new DocumentClassRepository(new DatabaseProvider());
  });

  describe("save", () => {
    it("should persist a DocumentClass and return it with an assigned id", () => {
      const dc = new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01");
      const saved = repo.save(dc);

      expect(saved.getId()).toBe(1);
      expect(saved.getUuid()).toBe("dc-uuid-001");
      expect(saved.getName()).toBe("Fatture");
      expect(saved.getTimestamp()).toBe("2024-01-01");
      expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("should assign incremental ids", () => {
      const first = repo.save(new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01"));
      const second = repo.save(new DocumentClass(1, "dc-uuid-002", "Contratti", "2024-02-01"));

      expect(first.getId()).toBe(1);
      expect(second.getId()).toBe(2);
    });
  });

  describe("getById", () => {
    it("should return the DocumentClass when it exists", () => {
      repo.save(new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01"));

      const found = repo.getById(1);

      expect(found).not.toBeNull();
      expect(found!.getUuid()).toBe("dc-uuid-001");
      expect(found!.getName()).toBe("Fatture");
    });

    it("should return null when not found", () => {
      expect(repo.getById(999)).toBeNull();
    });
  });

  describe("getByDipId", () => {
    it("should return all DocumentClasses for a given dipId", () => {
      repo.save(new DocumentClass(10, "dc-uuid-001", "Fatture", "2024-01-01"));
      repo.save(new DocumentClass(10, "dc-uuid-002", "Contratti", "2024-02-01"));
      repo.save(new DocumentClass(20, "dc-uuid-003", "PEC", "2024-03-01"));

      const results = repo.getByDipId(10);

      expect(results).toHaveLength(2);
      expect(results[0].getUuid()).toBe("dc-uuid-001");
      expect(results[1].getUuid()).toBe("dc-uuid-002");
    });

    it("should return empty array when no matches exist", () => {
      expect(repo.getByDipId(999)).toHaveLength(0);
    });
  });

  describe("getByStatus", () => {
    it("should return all DocumentClasses with matching status", () => {
      repo.save(new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01"));
      repo.save(new DocumentClass(1, "dc-uuid-002", "Contratti", "2024-02-01"));

      const results = repo.getByStatus(IntegrityStatusEnum.UNKNOWN);

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      repo.save(new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01"));

      expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
    });
  });

  describe("updateIntegrityStatus", () => {
    it("should update the integrity status", () => {
      repo.save(new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01"));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.VALID);

      const updated = repo.getById(1);
      expect(updated!.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });

    it("should not affect other records", () => {
      repo.save(new DocumentClass(1, "dc-uuid-001", "Fatture", "2024-01-01"));
      repo.save(new DocumentClass(1, "dc-uuid-002", "Contratti", "2024-02-01"));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.INVALID);

      expect(repo.getById(1)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
      expect(repo.getById(2)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });
});
