import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { Document } from "../../../src/entity/Document";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("DocumentRepository", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByProcessId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentRepository;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByProcessId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };
    repo = new DocumentRepository(dao as unknown as DocumentDAO);
  });

  const metadata = new Metadata(
    "root",
    [new Metadata("titolo", "Documento A", MetadataType.STRING)],
    MetadataType.COMPOSITE,
  );

  it("TU-F-browsing-55: save() should successfully persist a document with complex metadata", () => {
    const input = new Document("doc-1", metadata, "process-uuid");
    const saved = new Document(
      "doc-1",
      metadata,
      "process-uuid",
      IntegrityStatusEnum.UNKNOWN,
      1,
      10,
    );
    dao.save.mockReturnValue(saved);

    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result).toBe(saved);
  });

  it("TU-S-browsing-56: save() should handle updating an existing document", () => {
    const updated = new Document(
      "doc-unique",
      metadata,
      "process-uuid",
      IntegrityStatusEnum.UNKNOWN,
      2,
      10,
    );
    dao.save.mockReturnValue(updated);

    const result = repo.save(
      new Document("doc-unique", metadata, "process-uuid"),
    );

    expect(result.getUuid()).toBe("doc-unique");
    expect(dao.save).toHaveBeenCalledTimes(1);
  });

  it("TU-F-browsing-57: getByProcessId() should return a list of documents", () => {
    const rows = [new Document("doc-p1", metadata, "process-uuid")];
    dao.getByProcessId.mockReturnValue(rows);

    const results = repo.getByProcessId(1);

    expect(dao.getByProcessId).toHaveBeenCalledWith(1);
    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("doc-p1");
  });

  it("TU-F-browsing-58: getByProcessId() should return an empty array", () => {
    dao.getByProcessId.mockReturnValue([]);

    const results = repo.getByProcessId(999);

    expect(results).toHaveLength(0);
  });

  it("TU-F-browsing-59: getByStatus() should return documents", () => {
    const rows = [new Document("doc-s1", metadata, "process-uuid")];
    dao.getByStatus.mockReturnValue(rows);

    const results = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(results).toHaveLength(1);
  });

  it("TU-F-browsing-60: getByStatus() should return an empty array", () => {
    dao.getByStatus.mockReturnValue([]);

    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
  });

  it("TU-S-browsing-61: updateIntegrityStatus() should successfully update the status", () => {
    repo.updateIntegrityStatus(7, IntegrityStatusEnum.VALID);

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      7,
      IntegrityStatusEnum.VALID,
    );
  });

  it("TU-S-browsing-62: save() should fallback to select", () => {
    const saved = new Document(
      "doc-fallback",
      metadata,
      "process-uuid",
      IntegrityStatusEnum.UNKNOWN,
      33,
      10,
    );
    dao.save.mockReturnValue(saved);

    const result = repo.save(
      new Document("doc-fallback", metadata, "process-uuid"),
    );

    expect(result.getId()).toBe(33);
  });

  it("TU-F-browsing-63: getById() should return null quando il documento non esiste", () => {
    dao.getById.mockReturnValue(null);

    const result = repo.getById(999);

    expect(dao.getById).toHaveBeenCalledWith(999);
    expect(result).toBeNull();
  });
});
