import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileRepository } from "../../../src/repo/impl/FileRepository";
import { FileDAO } from "../../../src/dao/FileDAO";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { File } from "../../../src/entity/File";

describe("FileRepository", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByDocumentId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
    getAggregatedIntegrityStatusByDocumentId: ReturnType<typeof vi.fn>;
  };
  let repo: FileRepository;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByDocumentId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
      getAggregatedIntegrityStatusByDocumentId: vi.fn(),
    };
    repo = new FileRepository(dao as unknown as FileDAO);
  });

  it("TU-F-browsing-64: save() should save e getById funzionano", () => {
    const input = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash-main",
      true,
      "file-uuid",
      "doc-uuid",
    );
    const saved = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash-main",
      true,
      "file-uuid",
      "doc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      71,
      3,
    );
    dao.save.mockReturnValue(saved);
    dao.getById.mockReturnValue(saved);

    repo.save(input);
    const found = repo.getById(71);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(dao.getById).toHaveBeenCalledWith(71);
    expect(found?.getFilename()).toBe("main.xml");
    expect(found?.getDocumentId()).toBe(3);
  });

  it("TU-F-browsing-65: getByDocumentId() should getByDocumentId, getByStatus e updateIntegrityStatus funzionano", () => {
    const rows = [
      new File(
        "allegato.pdf",
        "/pkg/allegato.pdf",
        "hash-allegato",
        false,
        "file-uuid",
        "doc-uuid",
        IntegrityStatusEnum.INVALID,
        72,
        4,
      ),
    ];
    dao.getByDocumentId.mockReturnValue(rows);
    dao.getByStatus.mockReturnValue(rows);

    expect(repo.getByDocumentId(4)).toHaveLength(1);

    repo.updateIntegrityStatus(72, IntegrityStatusEnum.INVALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.INVALID);

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      72,
      IntegrityStatusEnum.INVALID,
    );
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(byStatus).toHaveLength(1);
  });

  it("TU-F-browsing-66: save() should save con fallback quando lastInsertRowid e falsy", () => {
    const saved = new File(
      "fallback.xml",
      "/pkg/fallback.xml",
      "hash",
      true,
      "file-uuid",
      "doc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      88,
      3,
    );
    dao.save.mockReturnValue(saved);

    const input = new File(
      "fallback.xml",
      "/pkg/fallback.xml",
      "hash",
      true,
      "file-uuid",
      "doc-uuid",
    );
    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result.getId()).toBe(88);
  });

  it("TU-F-browsing-67: getAggregatedIntegrityStatusByDocumentId() should getAggregatedIntegrityStatusByDocumentId return logic", () => {
    dao.getAggregatedIntegrityStatusByDocumentId
      .mockReturnValueOnce(IntegrityStatusEnum.UNKNOWN)
      .mockReturnValueOnce(IntegrityStatusEnum.UNKNOWN)
      .mockReturnValueOnce(IntegrityStatusEnum.INVALID)
      .mockReturnValueOnce(IntegrityStatusEnum.UNKNOWN)
      .mockReturnValueOnce(IntegrityStatusEnum.VALID);

    expect(repo.getAggregatedIntegrityStatusByDocumentId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(repo.getAggregatedIntegrityStatusByDocumentId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(repo.getAggregatedIntegrityStatusByDocumentId(2)).toBe(
      IntegrityStatusEnum.INVALID,
    );
    expect(repo.getAggregatedIntegrityStatusByDocumentId(3)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(repo.getAggregatedIntegrityStatusByDocumentId(4)).toBe(
      IntegrityStatusEnum.VALID,
    );
  });
});
