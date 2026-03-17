import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProcessRepository } from "../../src/repo/impl/ProcessRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { Process } from "../../src/entity/Process";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata } from "../../src/value-objects/Metadata";

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

describe("ProcessRepository", () => {
  let repo: ProcessRepository;

  beforeEach(() => {
    repo = new ProcessRepository(new DatabaseProvider());
  });

  describe("save", () => {
    it("should persist a Process and return it with an assigned id", () => {
      const proc = new Process(1, "proc-uuid-001", []);
      const saved = repo.save(proc);

      expect(saved.getId()).toBe(1);
      expect(saved.getUuid()).toBe("proc-uuid-001");
      expect(saved.getDocumentClassId()).toBe(1);
      expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("should persist metadata alongside the Process", () => {
      const metadata = [
        new Metadata("author", "John", "string"),
        new Metadata("count", "42", "number"),
      ];
      const proc = new Process(1, "proc-uuid-002", metadata);
      const saved = repo.save(proc);

      expect(saved.getMetadata()).toHaveLength(2);
      expect(saved.getMetadata()[0].name).toBe("author");
      expect(saved.getMetadata()[1].name).toBe("count");
    });

    it("should assign incremental ids", () => {
      const first = repo.save(new Process(1, "proc-uuid-001", []));
      const second = repo.save(new Process(1, "proc-uuid-002", []));

      expect(first.getId()).toBe(1);
      expect(second.getId()).toBe(2);
    });
  });

  describe("getById", () => {
    it("should return the Process when it exists", () => {
      repo.save(new Process(1, "proc-uuid-001", []));

      const found = repo.getById(1);

      expect(found).not.toBeNull();
      expect(found!.getUuid()).toBe("proc-uuid-001");
    });

    it("should load metadata with the Process", () => {
      const metadata = [new Metadata("key", "value", "string")];
      repo.save(new Process(1, "proc-uuid-001", metadata));

      const found = repo.getById(1);

      expect(found!.getMetadata()).toHaveLength(1);
      expect(found!.getMetadata()[0].name).toBe("key");
      expect(found!.getMetadata()[0].value).toBe("value");
    });

    it("should return null when not found", () => {
      expect(repo.getById(999)).toBeNull();
    });
  });

  describe("getByDocumentClassId", () => {
    it("should return all Processes for a given documentClassId", () => {
      repo.save(new Process(10, "proc-uuid-001", []));
      repo.save(new Process(10, "proc-uuid-002", []));
      repo.save(new Process(20, "proc-uuid-003", []));

      const results = repo.getByDocumentClassId(10);

      expect(results).toHaveLength(2);
      expect(results[0].getUuid()).toBe("proc-uuid-001");
      expect(results[1].getUuid()).toBe("proc-uuid-002");
    });

    it("should return empty array when no matches exist", () => {
      expect(repo.getByDocumentClassId(999)).toHaveLength(0);
    });
  });

  describe("getByStatus", () => {
    it("should return all Processes with matching status", () => {
      repo.save(new Process(1, "proc-uuid-001", []));
      repo.save(new Process(1, "proc-uuid-002", []));

      const results = repo.getByStatus(IntegrityStatusEnum.UNKNOWN);

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      repo.save(new Process(1, "proc-uuid-001", []));

      expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
    });
  });

  describe("updateIntegrityStatus", () => {
    it("should update the integrity status", () => {
      repo.save(new Process(1, "proc-uuid-001", []));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.VALID);

      const updated = repo.getById(1);
      expect(updated!.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });

    it("should not affect other records", () => {
      repo.save(new Process(1, "proc-uuid-001", []));
      repo.save(new Process(1, "proc-uuid-002", []));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.INVALID);

      expect(repo.getById(1)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
      expect(repo.getById(2)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });
});
