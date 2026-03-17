import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DocumentRepository } from "../../src/repo/impl/DocumentRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { Document } from "../../src/entity/Document";
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

describe("DocumentRepository", () => {
  let repo: DocumentRepository;

  beforeEach(() => {
    repo = new DocumentRepository(new DatabaseProvider());
  });

  describe("save", () => {
    it("should persist a Document and return it with an assigned id", () => {
      const doc = new Document("doc-uuid-001", [], 1);
      const saved = repo.save(doc);

      expect(saved.getId()).toBe(1);
      expect(saved.getUuid()).toBe("doc-uuid-001");
      expect(saved.getProcessId()).toBe(1);
      expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("should persist metadata alongside the Document", () => {
      const metadata = [
        new Metadata("title", "Invoice", "string"),
        new Metadata("pages", "5", "number"),
      ];
      const doc = new Document("doc-uuid-002", metadata, 1);
      const saved = repo.save(doc);

      expect(saved.getMetadata()).toHaveLength(2);
      expect(saved.getMetadata()[0].name).toBe("title");
      expect(saved.getMetadata()[0].value).toBe("Invoice");
      expect(saved.getMetadata()[1].name).toBe("pages");
    });

    it("should assign incremental ids", () => {
      const first = repo.save(new Document("doc-uuid-001", [], 1));
      const second = repo.save(new Document("doc-uuid-002", [], 1));

      expect(first.getId()).toBe(1);
      expect(second.getId()).toBe(2);
    });
  });

  describe("getById", () => {
    it("should return the Document when it exists", () => {
      repo.save(new Document("doc-uuid-001", [], 1));

      const found = repo.getById(1);

      expect(found).not.toBeNull();
      expect(found!.getUuid()).toBe("doc-uuid-001");
      expect(found!.getProcessId()).toBe(1);
    });

    it("should load metadata with the Document", () => {
      const metadata = [new Metadata("key", "val", "string")];
      repo.save(new Document("doc-uuid-001", metadata, 1));

      const found = repo.getById(1);

      expect(found!.getMetadata()).toHaveLength(1);
      expect(found!.getMetadata()[0].name).toBe("key");
      expect(found!.getMetadata()[0].value).toBe("val");
    });

    it("should return null when not found", () => {
      expect(repo.getById(999)).toBeNull();
    });
  });

  describe("getByProcessId", () => {
    it("should return all Documents for a given processId", () => {
      repo.save(new Document("doc-uuid-001", [], 10));
      repo.save(new Document("doc-uuid-002", [], 10));
      repo.save(new Document("doc-uuid-003", [], 20));

      const results = repo.getByProcessId(10);

      expect(results).toHaveLength(2);
      expect(results[0].getUuid()).toBe("doc-uuid-001");
      expect(results[1].getUuid()).toBe("doc-uuid-002");
    });

    it("should return empty array when no matches exist", () => {
      expect(repo.getByProcessId(999)).toHaveLength(0);
    });
  });

  describe("getByStatus", () => {
    it("should return all Documents with matching status", () => {
      repo.save(new Document("doc-uuid-001", [], 1));
      repo.save(new Document("doc-uuid-002", [], 1));

      const results = repo.getByStatus(IntegrityStatusEnum.UNKNOWN);

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      repo.save(new Document("doc-uuid-001", [], 1));

      expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
    });
  });

  describe("updateIntegrityStatus", () => {
    it("should update the integrity status", () => {
      repo.save(new Document("doc-uuid-001", [], 1));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.VALID);

      const updated = repo.getById(1);
      expect(updated!.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });

    it("should not affect other records", () => {
      repo.save(new Document("doc-uuid-001", [], 1));
      repo.save(new Document("doc-uuid-002", [], 1));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.INVALID);

      expect(repo.getById(1)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
      expect(repo.getById(2)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });
});
