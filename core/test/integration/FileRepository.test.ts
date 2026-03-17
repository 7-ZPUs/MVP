import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { FileRepository } from "../../src/repo/impl/FileRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { File } from "../../src/entity/File";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

vi.mock("better-sqlite3", () => {
  const { DatabaseSync } = require("node:sqlite");
  class FakeDatabase {
    private _db: InstanceType<typeof DatabaseSync>;
    constructor(_path: string) {
      this._db = new DatabaseSync(":memory:");
      // node:sqlite enables FK enforcement by default; disable it so the
      // file table (which has a typo: REFERENCES documento) can be used
      // in isolation without requiring the parent table to exist.
      this._db.exec("PRAGMA foreign_keys = OFF");
    }
    pragma() {}
    exec(sql: string) { return this._db.exec(sql); }
    prepare(sql: string) { return this._db.prepare(sql); }
  }
  return { default: FakeDatabase };
});

describe("FileRepository", () => {
  let repo: FileRepository;

  beforeEach(() => {
    repo = new FileRepository(new DatabaseProvider());
  });

  describe("save", () => {
    it("should persist a File and return it with an assigned id", () => {
      const file = new File("fattura.pdf", "/path/fattura.pdf", true, 1);
      const saved = repo.save(file);

      expect(saved.getId()).toBe(1);
      expect(saved.getFilename()).toBe("fattura.pdf");
      expect(saved.getPath()).toBe("/path/fattura.pdf");
      expect(saved.getIsMain()).toBe(true);
      expect(saved.getDocumentId()).toBe(1);
      expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("should persist isMain as false correctly", () => {
      const file = new File("metadata.xml", "/path/metadata.xml", false, 1);
      const saved = repo.save(file);

      expect(saved.getIsMain()).toBe(false);
    });

    it("should assign incremental ids", () => {
      const first = repo.save(new File("f1.pdf", "/a", true, 1));
      const second = repo.save(new File("f2.pdf", "/b", false, 1));

      expect(first.getId()).toBe(1);
      expect(second.getId()).toBe(2);
    });
  });

  describe("getById", () => {
    it("should return the File when it exists", () => {
      repo.save(new File("fattura.pdf", "/path/fattura.pdf", true, 1));

      const found = repo.getById(1);

      expect(found).not.toBeNull();
      expect(found!.getFilename()).toBe("fattura.pdf");
      expect(found!.getIsMain()).toBe(true);
    });

    it("should return null when not found", () => {
      expect(repo.getById(999)).toBeNull();
    });
  });

  describe("getByDocumentId", () => {
    it("should return all Files for a given documentId", () => {
      repo.save(new File("primary.pdf", "/a", true, 10));
      repo.save(new File("metadata.xml", "/b", false, 10));
      repo.save(new File("other.pdf", "/c", true, 20));

      const results = repo.getByDocumentId(10);

      expect(results).toHaveLength(2);
    });

    it("should order results with main files first", () => {
      repo.save(new File("metadata.xml", "/b", false, 10));
      repo.save(new File("primary.pdf", "/a", true, 10));

      const results = repo.getByDocumentId(10);

      expect(results[0].getIsMain()).toBe(true);
      expect(results[1].getIsMain()).toBe(false);
    });

    it("should return empty array when no matches exist", () => {
      expect(repo.getByDocumentId(999)).toHaveLength(0);
    });
  });

  describe("getByStatus", () => {
    it("should return all Files with matching status", () => {
      repo.save(new File("f1.pdf", "/a", true, 1));
      repo.save(new File("f2.pdf", "/b", false, 1));

      const results = repo.getByStatus(IntegrityStatusEnum.UNKNOWN);

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no matches", () => {
      repo.save(new File("f1.pdf", "/a", true, 1));

      expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
    });
  });

  describe("updateIntegrityStatus", () => {
    it("should update the integrity status", () => {
      repo.save(new File("fattura.pdf", "/path", true, 1));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.VALID);

      const updated = repo.getById(1);
      expect(updated!.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });

    it("should not affect other records", () => {
      repo.save(new File("f1.pdf", "/a", true, 1));
      repo.save(new File("f2.pdf", "/b", false, 1));

      repo.updateIntegrityStatus(1, IntegrityStatusEnum.INVALID);

      expect(repo.getById(1)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
      expect(repo.getById(2)!.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });
});
