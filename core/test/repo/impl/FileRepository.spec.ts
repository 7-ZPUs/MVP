import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileRepository } from "../../../src/repo/impl/FileRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { File } from "../../../src/entity/File";

describe("FileRepository", () => {
  const dao = {
    getById: vi.fn(),
    getByDocumentId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    updateIntegrityStatus: vi.fn(),
    getAggregatedIntegrityStatusByDocumentId: vi.fn(),
  };

  let repo: FileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new FileRepository(dao as any);
  });

  it("delegates save and getById", () => {
    const input = new File(
      "a.txt",
      "/tmp/a.txt",
      "hash-a",
      true,
      "file-uuid-a",
      "doc-uuid",
    );
    const out = new File(
      "a.txt",
      "/tmp/a.txt",
      "hash-a",
      true,
      "file-uuid-a",
      "doc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      1,
      10,
    );

    dao.save.mockReturnValue(out);
    dao.getById.mockReturnValue(out);

    expect(repo.save(input)).toBe(out);
    expect(repo.getById(1)).toBe(out);
    expect(dao.save).toHaveBeenCalledWith(input);
    expect(dao.getById).toHaveBeenCalledWith(1);
  });

  it("delegates getByDocumentId and getByStatus", () => {
    const list = [
      new File(
        "b.txt",
        "/tmp/b.txt",
        "hash-b",
        false,
        "file-uuid-b",
        "doc-uuid",
        IntegrityStatusEnum.VALID,
        2,
        10,
      ),
    ];

    dao.getByDocumentId.mockReturnValue(list);
    dao.getByStatus.mockReturnValue(list);

    expect(repo.getByDocumentId(10)).toBe(list);
    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toBe(list);
    expect(dao.getByDocumentId).toHaveBeenCalledWith(10);
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
  });

  it("delegates update and aggregated status", () => {
    dao.getAggregatedIntegrityStatusByDocumentId.mockReturnValue(
      IntegrityStatusEnum.INVALID,
    );

    repo.updateIntegrityStatus(5, IntegrityStatusEnum.UNKNOWN);
    expect(repo.getAggregatedIntegrityStatusByDocumentId(7)).toBe(
      IntegrityStatusEnum.INVALID,
    );

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      5,
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(dao.getAggregatedIntegrityStatusByDocumentId).toHaveBeenCalledWith(7);
  });
});
